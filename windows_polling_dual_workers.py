#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WINDOWS POLLING SERVICE - DUAL WORKERS
Sistema com 2 cadastros simultâneos para condomínios grandes
"""

import os
import json
import time
import requests
import base64
import logging
import subprocess
import threading
import queue
from datetime import datetime
from dotenv import load_dotenv

# Carregar .env
load_dotenv()

# FORÇAR DIRETÓRIO ABSOLUTO
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
print(f"[DEBUG] Diretório do script: {SCRIPT_DIR}")

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [WORKER-%(thread)d] %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(SCRIPT_DIR, 'dual_workers.log')),
        logging.StreamHandler()
    ]
)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("[ERRO] SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no .env")
    exit(1)

print("WINDOWS DUAL WORKERS SERVICE - VISIT HUB")
print("==================================================")
print("[OK] 2 CADASTROS SIMULTÂNEOS ATIVADOS!")
print("[OK] Arquitetura SEGURA - Windows NAO exposto!")
print("[INFO] Verificando fila de cadastros...")
print("==================================================")

# Fila para itens de processamento
work_queue = queue.Queue()
active_workers = {}
worker_lock = threading.Lock()

class DualWorkersService:
    def __init__(self):
        self.supabase_url = SUPABASE_URL
        self.supabase_key = SUPABASE_SERVICE_KEY
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        # Scripts path
        self.script_create = os.path.join(SCRIPT_DIR, 'test_form_direct.py')
        self.script_reactivate = os.path.join(SCRIPT_DIR, 'test_reactivate_visitor.py')
        
        if not os.path.exists(self.script_create):
            logging.error(f"Script de criação não encontrado: {self.script_create}")
            exit(1)
        if not os.path.exists(self.script_reactivate):
            logging.error(f"Script de reativação não encontrado: {self.script_reactivate}")
            exit(1)
        
        logging.info("[OK] Dual Workers Service inicializado")
        logging.info(f"[OK] Script criação: {self.script_create}")
        logging.info(f"[OK] Script reativação: {self.script_reactivate}")

    def check_queue(self, limit=2):
        """Verificar fila de cadastros pendentes (até 2 por vez)"""
        try:
            url = f"{self.supabase_url}/rest/v1/visitor_registration_queue"
            params = {
                'status': 'eq.pending',
                'select': '*',
                'order': 'created_at.asc',
                'limit': str(limit)
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code == 200:
                items = response.json()
                return items if items else []
            else:
                logging.error(f"Erro ao verificar fila: {response.status_code}")
                return []
                
        except Exception as e:
            logging.error(f"Erro na verificação da fila: {e}")
            return []

    def mark_processing(self, item_id, worker_id):
        """Marcar item como processando"""
        try:
            url = f"{self.supabase_url}/rest/v1/visitor_registration_queue"
            data = {
                "status": "processing",
                "worker_id": worker_id,
                "processing_started_at": datetime.now().isoformat()
            }
            params = {"id": f"eq.{item_id}"}
            
            response = requests.patch(url, headers=self.headers, json=data, params=params)
            return response.status_code == 200
        except Exception as e:
            logging.error(f"Erro ao marcar como processando: {e}")
            return False

    def mark_completed(self, item_id):
        """Marcar item como concluído"""
        try:
            url = f"{self.supabase_url}/rest/v1/visitor_registration_queue"
            from datetime import timezone
            data = {"status": "completed", "processed_at": datetime.now(timezone.utc).isoformat()}
            params = {"id": f"eq.{item_id}"}
            
            response = requests.patch(url, headers=self.headers, json=data, params=params)
            return response.status_code == 200
        except Exception as e:
            logging.error(f"Erro ao marcar como concluído: {e}")
            return False

    def mark_failed(self, item_id, error_message=""):
        """Marcar item como falhado"""
        try:
            url = f"{self.supabase_url}/rest/v1/visitor_registration_queue"
            from datetime import timezone
            data = {
                "status": "failed", 
                "error_message": error_message,
                "processed_at": datetime.now(timezone.utc).isoformat()
            }
            params = {"id": f"eq.{item_id}"}
            
            response = requests.patch(url, headers=self.headers, json=data, params=params)
            return response.status_code == 200
        except Exception as e:
            logging.error(f"Erro ao marcar como falhado: {e}")
            return False

    def save_photo(self, photo_base64, visitor_id):
        """Salvar foto do visitante"""
        if not photo_base64:
            return None
            
        try:
            photo_data = base64.b64decode(photo_base64)
            photo_filename = f"visitor_photo_{visitor_id}.jpg"
            photo_path = os.path.join(SCRIPT_DIR, photo_filename)
            
            with open(photo_path, 'wb') as f:
                f.write(photo_data)
            
            return photo_path
        except Exception as e:
            logging.error(f"Erro ao salvar foto: {e}")
            return None

    def worker_process(self, worker_id):
        """Processo do worker individual"""
        logging.info(f"🚀 Worker {worker_id} iniciado")
        
        while True:
            try:
                # Aguardar item na fila
                try:
                    item = work_queue.get(timeout=5)
                except queue.Empty:
                    continue
                
                visitor_id = item['id']
                
                with worker_lock:
                    active_workers[worker_id] = {
                        'visitor_id': visitor_id,
                        'status': 'processing',
                        'start_time': datetime.now().isoformat()
                    }
                
                logging.info(f"📝 Worker {worker_id} processando visitante {visitor_id}")
                
                # Marcar como processando
                if not self.mark_processing(visitor_id, worker_id):
                    logging.error(f"❌ Erro ao marcar {visitor_id} como processando")
                    continue
                
                # Processar item
                success = self.process_visitor(item, worker_id)
                
                # Atualizar status
                if success:
                    self.mark_completed(visitor_id)
                    logging.info(f"✅ Worker {worker_id} completou {visitor_id}")
                else:
                    self.mark_failed(visitor_id, "Falha na automação")
                    logging.error(f"❌ Worker {worker_id} falhou {visitor_id}")
                
                with worker_lock:
                    active_workers[worker_id] = {
                        'visitor_id': None,
                        'status': 'idle',
                        'last_completed': datetime.now().isoformat()
                    }
                
                work_queue.task_done()
                
            except Exception as e:
                logging.error(f"❌ Worker {worker_id} erro: {e}")
                work_queue.task_done()

    def process_visitor(self, item, worker_id):
        """Processar um visitante específico"""
        try:
            visitor_id = item['id']
            visitor_data_from_queue = item.get('visitor_data', {})
            action_type = visitor_data_from_queue.get('action', 'create')
            
            logging.info(f"🔄 Worker {worker_id}: {action_type} para {visitor_id}")
            
            # Salvar foto se existir
            photo_path = None
            if item.get('photo_base64'):
                photo_path = self.save_photo(item['photo_base64'], visitor_id)
            
            # Preparar dados
            visitor_data = {
                'nome': visitor_data_from_queue.get('nome', ''),
                'telefone': visitor_data_from_queue.get('telefone', ''),
                'cpf': visitor_data_from_queue.get('cpf', ''),
                'rg': visitor_data_from_queue.get('rg', ''),
                'placa': visitor_data_from_queue.get('placa', ''),
                'genero': visitor_data_from_queue.get('genero', 'Masculino'),
                'morador_nome': visitor_data_from_queue.get('morador_nome', ''),
                'validade_dias': visitor_data_from_queue.get('validade_dias', 1),
                'action': action_type,
                'photo_path': photo_path
            }
            
            # Salvar dados temporários
            json_filename = f"visitor_data_{visitor_id}_worker{worker_id}.json"
            json_path = os.path.join(SCRIPT_DIR, json_filename)
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(visitor_data, f, ensure_ascii=False, indent=2)
            
            # Executar script apropriado
            if action_type == 'reactivate':
                cmd = [
                    'python',
                    self.script_reactivate,
                    '--visitor-id', visitor_id
                ]
            else:
                cmd = [
                    'python',
                    self.script_create,
                    '--visitor-data', json_path,
                    '--visitor-id', visitor_id
                ]
            
            logging.info(f"📋 Worker {worker_id} executando: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=SCRIPT_DIR,
                timeout=300  # 5 minutos timeout
            )
            
            # Limpar arquivo temporário
            try:
                os.remove(json_path)
            except:
                pass
            
            if result.returncode == 0:
                logging.info(f"✅ Worker {worker_id} sucesso: {visitor_id}")
                return True
            else:
                logging.error(f"❌ Worker {worker_id} falha: {result.stderr}")
                return False
                
        except Exception as e:
            logging.error(f"❌ Worker {worker_id} erro no processamento: {e}")
            return False

    def queue_monitor(self):
        """Monitor da fila - adiciona itens à fila de workers"""
        logging.info("🔍 Monitor de fila iniciado")
        
        while True:
            try:
                # Verificar quantos workers estão livres
                with worker_lock:
                    idle_workers = sum(1 for w in active_workers.values() if w.get('status') == 'idle')
                
                # Buscar itens pendentes (máximo = workers livres)
                if idle_workers > 0:
                    items = self.check_queue(limit=min(2, idle_workers))
                    
                    for item in items:
                        work_queue.put(item)
                        logging.info(f"📥 Item {item['id']} adicionado à fila")
                
                # Aguardar antes da próxima verificação
                time.sleep(15)  # Verificar a cada 15 segundos
                
            except Exception as e:
                logging.error(f"❌ Erro no monitor: {e}")
                time.sleep(30)

    def start_workers(self):
        """Iniciar os 2 workers"""
        # Inicializar status dos workers
        with worker_lock:
            for i in range(1, 3):  # Workers 1 e 2
                active_workers[i] = {
                    'visitor_id': None,
                    'status': 'idle',
                    'start_time': datetime.now().isoformat()
                }
        
        # Iniciar threads dos workers
        for worker_id in range(1, 3):
            worker_thread = threading.Thread(
                target=self.worker_process,
                args=(worker_id,),
                daemon=True
            )
            worker_thread.start()
            logging.info(f"✅ Worker {worker_id} thread iniciada")
        
        # Iniciar monitor da fila
        monitor_thread = threading.Thread(
            target=self.queue_monitor,
            daemon=True
        )
        monitor_thread.start()
        logging.info("✅ Monitor da fila iniciado")

    def print_status(self):
        """Imprimir status dos workers"""
        with worker_lock:
            logging.info("📊 STATUS DOS WORKERS:")
            for worker_id, status in active_workers.items():
                visitor = status.get('visitor_id', 'None')
                state = status.get('status', 'unknown')
                logging.info(f"   Worker {worker_id}: {state} - Visitante: {visitor}")

    def run(self):
        """Executar o serviço"""
        logging.info("🚀 Iniciando Dual Workers Service...")
        
        # Iniciar workers
        self.start_workers()
        
        # Loop principal
        try:
            while True:
                time.sleep(60)  # Status a cada minuto
                self.print_status()
        except KeyboardInterrupt:
            logging.info("🛑 Serviço interrompido pelo usuário")
        except Exception as e:
            logging.error(f"❌ Erro no loop principal: {e}")

if __name__ == "__main__":
    service = DualWorkersService()
    service.run()

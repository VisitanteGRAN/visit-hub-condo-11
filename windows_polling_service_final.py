#!/usr/bin/env python3
# -*- coding: utf-8 -*-

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
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(SCRIPT_DIR, 'polling_service.log')),
        logging.StreamHandler()
    ]
)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("[ERRO] SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no .env")
    exit(1)

print("[OK] Arquivo .env carregado com sucesso")

print("WINDOWS POLLING SERVICE - VISIT HUB")
print("==================================================")
print("[OK] Arquitetura SEGURA - Windows NAO exposto!")
print("[INFO] MODO DUAL WORKERS ATIVADO - 2 CADASTROS SIMULTÂNEOS!")
print("[INFO] Verificando fila de cadastros...")
print("==================================================")

# Fila global para threading
work_queue = queue.Queue()
worker_lock = threading.Lock()

class WindowsPollingService:
    def __init__(self):
        self.supabase_url = SUPABASE_URL
        self.supabase_key = SUPABASE_SERVICE_KEY
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        # USAR O SCRIPT QUE ESTAVA FUNCIONANDO 100%
        self.script_path = os.path.join(SCRIPT_DIR, 'test_form_direct.py')
        if not os.path.exists(self.script_path):
            print(f"[ERRO] Script não encontrado: {self.script_path}")
            exit(1)
        
        logging.info("[OK] Cliente Supabase inicializado")
        logging.info(f"[OK] Processador HikCentral pronto: {self.script_path}")
        logging.info("[OK] Servico iniciado - Polling a cada 30s")

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
                data = response.json()
                return data if data else []
            else:
                logging.error(f"[ERRO] Falha ao consultar fila: {response.status_code}")
                return []
                
        except Exception as e:
            logging.error(f"[ERRO] Erro ao verificar fila: {e}")
            return []

    def mark_processing(self, item_id):
        """Marcar item como processando"""
        try:
            url = f"{self.supabase_url}/rest/v1/visitor_registration_queue"
            data = {"status": "processing"}
            params = {"id": f"eq.{item_id}"}
            
            response = requests.patch(url, headers=self.headers, json=data, params=params)
            return response.status_code in [200, 204]
        except Exception as e:
            logging.error(f"[ERRO] Erro ao marcar processando: {e}")
            return False

    def mark_completed(self, item_id):
        """Marcar item como concluído"""
        try:
            url = f"{self.supabase_url}/rest/v1/visitor_registration_queue"
            from datetime import timezone
            data = {"status": "completed", "processed_at": datetime.now(timezone.utc).isoformat()}
            params = {"id": f"eq.{item_id}"}
            
            response = requests.patch(url, headers=self.headers, json=data, params=params)
            return response.status_code in [200, 204]
        except Exception as e:
            logging.error(f"[ERRO] Erro ao marcar concluido: {e}")
            return False

    def mark_failed(self, item_id, error_message=""):
        """Marcar item como falhado"""
        try:
            url = f"{self.supabase_url}/rest/v1/visitor_registration_queue"
            from datetime import timezone
            data = {
                "status": "failed", 
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "error_message": error_message[:500]  # Limitar tamanho
            }
            params = {"id": f"eq.{item_id}"}
            
            response = requests.patch(url, headers=self.headers, json=data, params=params)
            return response.status_code in [200, 204]
        except Exception as e:
            logging.error(f"[ERRO] Erro ao marcar falhado: {e}")
            return False

    def save_visitor_data(self, visitor_data, visitor_id):
        """Salvar dados do visitante em arquivo JSON - CAMINHO ABSOLUTO"""
        try:
            # FORÇAR CAMINHO ABSOLUTO NO DIRETÓRIO DO SCRIPT
            json_path = os.path.join(SCRIPT_DIR, f'visitor_data_{visitor_id}.json')
            
            # DEBUG: Verificar dados antes de salvar
            print(f"[DEBUG] Salvando dados: {visitor_data}")
            print(f"[DEBUG] Caminho de destino: {json_path}")
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(visitor_data, f, ensure_ascii=False, indent=2)
            
            # Verificar se foi salvo
            if os.path.exists(json_path):
                size = os.path.getsize(json_path)
                print(f"[DEBUG] Arquivo salvo com {size} bytes")
            else:
                print(f"[DEBUG] ERRO: Arquivo não foi criado!")
            
            logging.info(f"[PROCESS] Dados salvos: {json_path}")
            return json_path
            
        except Exception as e:
            logging.error(f"[ERRO] Erro ao salvar dados: {e}")
            return None

    def save_photo(self, photo_base64, visitor_id):
        """Salvar foto em arquivo - CAMINHO ABSOLUTO"""
        try:
            if not photo_base64:
                return None
                
            # FORÇAR CAMINHO ABSOLUTO NO DIRETÓRIO DO SCRIPT  
            photo_path = os.path.join(SCRIPT_DIR, f'visitor_photo_{visitor_id}.jpg')
            
            # Remover prefixo data:image se presente
            if photo_base64.startswith('data:image'):
                photo_base64 = photo_base64.split(',')[1]
            
            photo_data = base64.b64decode(photo_base64)
            
            with open(photo_path, 'wb') as f:
                f.write(photo_data)
            
            logging.info(f"[PROCESS] Foto salva: {photo_path}")
            return photo_path
            
        except Exception as e:
            logging.error(f"[ERRO] Erro ao salvar foto: {e}")
            return None

    def process_visitor(self, item):
        """Processar cadastro/reativação de visitante - VERSÃO INTELIGENTE"""
        try:
            visitor_id = item['id']
            visitor_data_temp = item.get('visitor_data', {})
            visitor_name = visitor_data_temp.get('nome', 'Desconhecido')
            # Verificar ação no visitor_data ou fallback no item
            action_type = visitor_data_temp.get('action', item.get('action_type', 'create'))  # 'create' ou 'reactivate'
            cpf = visitor_data_temp.get('cpf', '')
            
            # ESCOLHER SCRIPT BASEADO NO TIPO DE AÇÃO
            if action_type == 'reactivate':
                script_name = 'test_reactivate_visitor.py'
                logging.info(f"[REACTIVATE] Reativando visitante: {visitor_name} (CPF: {cpf})")
            else:
                script_name = 'test_form_direct.py'
                logging.info(f"[CREATE] Criando novo visitante: {visitor_name}")
            
            script_path = os.path.join(SCRIPT_DIR, script_name)
            
            # Verificar se script existe
            if not os.path.exists(script_path):
                logging.error(f"[ERRO] Script não encontrado: {script_path}")
                self.mark_failed(visitor_id, f"Script não encontrado: {script_name}")
                return False
            
            # Marcar como processando
            if not self.mark_processing(visitor_id):
                logging.error(f"[ERRO] Falha ao marcar processando: {visitor_id}")
                return False
            
            logging.info(f"[STATUS] Item {visitor_id} marcado como processando")
            
            # Salvar foto se presente (apenas para cadastro novo)
            photo_path = None
            if action_type == 'create' and item.get('photo_base64'):
                photo_path = self.save_photo(item['photo_base64'], visitor_id)
            
            # Preparar dados para script
            visitor_data_from_queue = item.get('visitor_data', {})
            visitor_data = {
                'nome': visitor_data_from_queue.get('nome', ''),
                'telefone': visitor_data_from_queue.get('telefone', ''),
                'cpf': visitor_data_from_queue.get('cpf', ''),
                'rg': visitor_data_from_queue.get('rg', ''),
                'placa': visitor_data_from_queue.get('placa', ''),
                'genero': visitor_data_from_queue.get('genero', 'Masculino'),
                'morador_nome': visitor_data_from_queue.get('morador_nome', 'lucca lacerda'),  # ⭐ Nome do morador (CRÍTICO para reativação)
                'photo_path': photo_path
            }
            
            # Salvar dados em JSON
            json_path = self.save_visitor_data(visitor_data, visitor_id)
            if not json_path:
                self.mark_failed(visitor_id, "Falha ao salvar dados")
                return False
            
            # VERIFICAR SE ARQUIVOS FORAM CRIADOS
            print(f"[DEBUG] JSON existe: {os.path.exists(json_path)}")
            if photo_path:
                print(f"[DEBUG] Foto existe: {os.path.exists(photo_path)}")
            
            # Executar script apropriado - ARGUMENTOS CORRETOS PARA CADA TIPO
            if action_type == 'reactivate':
                # Script de reativação: apenas visitor-id (SEM HEADLESS para configurar data)
                cmd = [
                    'python', 
                    script_path,
                    '--visitor-id', visitor_id
                    # ⭐ REMOVIDO --headless para permitir visualização da configuração de data
                ]
            else:
                # Script de cadastro: visitor-data + visitor-id (SEM HEADLESS para configurar duração)
                cmd = [
                    'python', 
                    script_path,
                    '--visitor-data', json_path,
                    '--visitor-id', visitor_id
                    # ⭐ REMOVIDO --headless para permitir configuração manual de data
                ]
            
            logging.info(f"[PROCESS] Executando: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutos timeout
                cwd=SCRIPT_DIR  # FORÇAR WORKING DIRECTORY
            )
            
            # Limpar arquivos temporários
            try:
                if os.path.exists(json_path):
                    os.remove(json_path)
                if photo_path and os.path.exists(photo_path):
                    os.remove(photo_path)
            except Exception as e:
                logging.warning(f"[WARN] Erro ao limpar arquivos: {e}")
            
            if result.returncode == 0:
                logging.info(f"[SUCCESS] Sucesso para {visitor_id}")
                logging.info(f"[PROCESS] STDOUT: {result.stdout}")
                self.mark_completed(visitor_id)
                return True
            else:
                error_msg = result.stderr or result.stdout or "Erro desconhecido"
                logging.error(f"[PROCESS] Falha para {visitor_id}")
                logging.error(f"[PROCESS] STDERR: {result.stderr}")
                logging.error(f"[PROCESS] STDOUT: {result.stdout}")
                self.mark_failed(visitor_id, error_msg)
                return False
                
        except Exception as e:
            logging.error(f"[ERRO] Erro ao processar visitante: {e}")
            if 'visitor_id' in locals():
                self.mark_failed(visitor_id, str(e))
            return False

    def worker_thread(self, worker_id):
        """Thread worker para processar itens da fila"""
        logging.info(f"🚀 Worker {worker_id} iniciado")
        
        while True:
            try:
                # Aguardar item na fila (timeout para evitar travamento)
                try:
                    item = work_queue.get(timeout=5)
                except queue.Empty:
                    continue
                
                with worker_lock:
                    logging.info(f"📝 Worker {worker_id} processando: {item['id']}")
                
                # Processar visitante
                success = self.process_visitor(item)
                
                with worker_lock:
                    if success:
                        logging.info(f"✅ Worker {worker_id} completou: {item['id']}")
                    else:
                        logging.error(f"❌ Worker {worker_id} falhou: {item['id']}")
                
                # Marcar tarefa como concluída
                work_queue.task_done()
                
            except Exception as e:
                logging.error(f"❌ Worker {worker_id} erro: {e}")
                work_queue.task_done()

    def run(self):
        """Loop principal do serviço com 2 workers"""
        logging.info("[INFO] Iniciando DUAL WORKERS polling...")
        
        # Iniciar 2 workers
        for worker_id in range(1, 3):  # Workers 1 e 2
            worker = threading.Thread(
                target=self.worker_thread,
                args=(worker_id,),
                daemon=True
            )
            worker.start()
            logging.info(f"✅ Worker {worker_id} thread iniciada")
        
        # Loop principal - alimenta a fila
        while True:
            try:
                # Verificar fila de até 2 itens
                items = self.check_queue(limit=2)
                
                if items:
                    logging.info(f"[QUEUE] {len(items)} item(s) encontrado(s)")
                    
                    # Adicionar itens à fila de workers
                    for item in items:
                        work_queue.put(item)
                        logging.info(f"📥 Item {item['id']} adicionado à fila de workers")
                else:
                    logging.info("[QUEUE] Fila vazia")
                    logging.info("[INFO] Aguardando novos itens...")
                
                # Aguardar antes da próxima verificação
                time.sleep(15)  # Verificar a cada 15 segundos
                
            except KeyboardInterrupt:
                logging.info("[INFO] Servico interrompido pelo usuario")
                break
            except Exception as e:
                logging.error(f"[ERRO] Erro no loop principal: {e}")
                time.sleep(5)

if __name__ == "__main__":
    service = WindowsPollingService()
    service.run()

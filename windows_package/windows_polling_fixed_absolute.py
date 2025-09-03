#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
import requests
import base64
import logging
import subprocess
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
print("[INFO] Verificando fila de cadastros...")
print("==================================================")

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
        
        # SCRIPT PATH COM CAMINHO ABSOLUTO
        self.script_path = os.path.join(SCRIPT_DIR, 'test_hikcentral_demo_completo.py')
        if not os.path.exists(self.script_path):
            print(f"[ERRO] Script não encontrado: {self.script_path}")
            exit(1)
        
        logging.info("[OK] Cliente Supabase inicializado")
        logging.info(f"[OK] Processador HikCentral pronto: {self.script_path}")
        logging.info("[OK] Servico iniciado - Polling a cada 30s")

    def check_queue(self):
        """Verificar fila de cadastros pendentes"""
        try:
            url = f"{self.supabase_url}/rest/v1/visitor_registration_queue"
            params = {
                'status': 'eq.pending',
                'select': '*',
                'order': 'created_at.asc',
                'limit': '1'
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data[0] if data else None
            else:
                logging.error(f"[ERRO] Falha ao consultar fila: {response.status_code}")
                return None
                
        except Exception as e:
            logging.error(f"[ERRO] Erro ao verificar fila: {e}")
            return None

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
            data = {"status": "completed", "processed_at": datetime.utcnow().isoformat()}
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
            data = {
                "status": "failed", 
                "processed_at": datetime.utcnow().isoformat(),
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
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(visitor_data, f, ensure_ascii=False, indent=2)
            
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
        """Processar cadastro de visitante"""
        try:
            visitor_id = item['id']
            visitor_name = item.get('name', 'Desconhecido')
            
            logging.info(f"[PROCESS] Processando: {visitor_name}")
            
            # Marcar como processando
            if not self.mark_processing(visitor_id):
                logging.error(f"[ERRO] Falha ao marcar processando: {visitor_id}")
                return False
            
            logging.info(f"[STATUS] Item {visitor_id} marcado como processando")
            
            # Salvar foto se presente
            photo_path = None
            if item.get('photo_base64'):
                photo_path = self.save_photo(item['photo_base64'], visitor_id)
            
            # Preparar dados para script
            visitor_data = {
                'name': item.get('name', ''),
                'phone': item.get('phone', ''),
                'rg': item.get('rg', ''),
                'placa': item.get('placa', ''),
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
            
            # Executar script de automação
            cmd = [
                'python', 
                self.script_path,
                '--visitor-data', json_path,
                '--visitor-id', visitor_id
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
                self.mark_completed(visitor_id)
                return True
            else:
                error_msg = result.stderr or result.stdout or "Erro desconhecido"
                logging.error(f"[PROCESS] Falha para {visitor_id}")
                logging.error(f"[PROCESS] STDERR: {result.stderr}")
                self.mark_failed(visitor_id, error_msg)
                return False
                
        except Exception as e:
            logging.error(f"[ERRO] Erro ao processar visitante: {e}")
            self.mark_failed(visitor_id, str(e))
            return False

    def run(self):
        """Loop principal do serviço"""
        logging.info("[INFO] Iniciando polling loop...")
        
        while True:
            try:
                # Verificar fila
                item = self.check_queue()
                
                if item:
                    logging.info(f"[QUEUE] Item encontrado: {item['id']}")
                    self.process_visitor(item)
                else:
                    logging.info("[QUEUE] Fila vazia")
                    logging.info("[INFO] Aguardando novos itens...")
                
                # Aguardar antes da próxima verificação
                time.sleep(30)
                
            except KeyboardInterrupt:
                logging.info("[INFO] Servico interrompido pelo usuario")
                break
            except Exception as e:
                logging.error(f"[ERRO] Erro no loop principal: {e}")
                time.sleep(10)

if __name__ == "__main__":
    service = WindowsPollingService()
    service.run() 
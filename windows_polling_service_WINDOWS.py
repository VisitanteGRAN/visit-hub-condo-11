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

# Configuração de logging - WINDOWS COMPATIBLE (SEM EMOJIS)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(SCRIPT_DIR, 'polling_service_windows.log'), encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# CONFIGURAÇÕES API LOCAL SEGURA
API_BASE_URL = os.getenv('AUTOMATION_SERVER_URL', 'http://localhost:5001')
SYSTEM_TOKEN = os.getenv('SYSTEM_API_TOKEN', 'system_cc022e9eab75dda71013be8c7d1831ae')

if not API_BASE_URL or not SYSTEM_TOKEN:
    print("[ERRO] AUTOMATION_SERVER_URL ou SYSTEM_API_TOKEN não encontrados no .env")
    exit(1)

print("[OK] Arquivo .env carregado com sucesso")

print("WINDOWS POLLING SERVICE - VISIT HUB")
print("==================================================")
print("[OK] Arquitetura SEGURA - Windows NAO exposto!")
print("[INFO] MODO DUAL WORKERS ATIVADO - 2 CADASTROS SIMULTÂNEOS!")
print("[INFO] Verificando fila de cadastros...")
print(f"[INFO] API Base: {API_BASE_URL}")
print(f"[INFO] Token: {SYSTEM_TOKEN[:12]}...")
print("==================================================")

# Fila global para threading
work_queue = queue.Queue()
worker_lock = threading.Lock()

class WindowsPollingService:
    def __init__(self):
        self.api_base_url = API_BASE_URL
        self.system_token = SYSTEM_TOKEN
        self.headers = {
            'Authorization': f'Bearer {self.system_token}',
            'Content-Type': 'application/json'
        }
        
        # USAR O SCRIPT CORRIGIDO
        self.script_path = os.path.join(SCRIPT_DIR, 'test_form_direct_CORRIGIDO.py')
        if not os.path.exists(self.script_path):
            print(f"[WARN] Script corrigido não encontrado: {self.script_path}")
            # Fallback para script original
            self.script_path = os.path.join(SCRIPT_DIR, 'test_form_direct.py')
            if not os.path.exists(self.script_path):
                print(f"[ERRO] Nenhum script encontrado!")
                exit(1)
        
        logging.info("[OK] Cliente API local inicializado")
        logging.info(f"[OK] Processador HikCentral pronto: {self.script_path}")
        logging.info("[OK] Servico iniciado - Polling a cada 30s")

    def check_queue(self, limit=2):
        """Verificar fila de cadastros pendentes via API local (até 2 por vez)"""
        try:
            url = f"{self.api_base_url}/api/visitante"
            params = {
                'status': 'pending',
                'limit': str(limit)
            }
            
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Verificar se resposta é lista ou tem estrutura específica
                if isinstance(data, dict) and 'data' in data:
                    return data['data'] if data['data'] else []
                elif isinstance(data, list):
                    return data
                else:
                    logging.warning(f"[WARN] Formato de resposta inesperado: {type(data)}")
                    return []
            elif response.status_code == 401:
                logging.error(f"[ERRO] Token inválido ou expirado - Token usado: {self.system_token[:12]}...")
                return []
            else:
                logging.error(f"[ERRO] Falha ao consultar fila: {response.status_code} - {response.text}")
                return []
                
        except requests.exceptions.Timeout:
            logging.error(f"[ERRO] Timeout ao consultar fila")
            return []
        except requests.exceptions.ConnectionError:
            logging.error(f"[ERRO] Erro de conexão com API local - verifique se está rodando")
            return []
        except Exception as e:
            logging.error(f"[ERRO] Erro ao verificar fila: {e}")
            return []

    def mark_processing(self, item_id):
        """Marcar item como processando via API local"""
        try:
            url = f"{self.api_base_url}/api/visitante/{item_id}/status"
            data = {"status": "processing"}
            
            response = requests.patch(url, headers=self.headers, json=data, timeout=10)
            return response.status_code in [200, 204]
        except Exception as e:
            logging.error(f"[ERRO] Erro ao marcar processando: {e}")
            return False

    def mark_completed(self, item_id):
        """Marcar item como concluído via API local"""
        try:
            url = f"{self.api_base_url}/api/visitante/{item_id}/status"
            from datetime import timezone
            data = {
                "status": "completed", 
                "processed_at": datetime.now(timezone.utc).isoformat()
            }
            
            response = requests.patch(url, headers=self.headers, json=data, timeout=10)
            return response.status_code in [200, 204]
        except Exception as e:
            logging.error(f"[ERRO] Erro ao marcar concluido: {e}")
            return False

    def mark_failed(self, item_id, error_message=""):
        """Marcar item como falhado via API local"""
        try:
            url = f"{self.api_base_url}/api/visitante/{item_id}/status"
            from datetime import timezone
            data = {
                "status": "failed", 
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "error_message": error_message[:500]  # Limitar tamanho
            }
            
            response = requests.patch(url, headers=self.headers, json=data, timeout=10)
            return response.status_code in [200, 204]
        except Exception as e:
            logging.error(f"[ERRO] Erro ao marcar falhado: {e}")
            return False

    def process_visitor(self, item):
        """Processar cadastro de visitante - VERSÃO SIMPLIFICADA SEM ARQUIVOS TEMPORÁRIOS"""
        try:
            visitor_id = item.get('id', 'unknown')
            visitor_data_temp = item.get('visitor_data', {})
            visitor_name = visitor_data_temp.get('nome', 'Desconhecido')
            action_type = visitor_data_temp.get('action', item.get('action_type', 'create'))
            
            logging.info(f"[PROCESS] Processando visitante: {visitor_name} (ID: {visitor_id})")
            logging.info(f"[PROCESS] Tipo de ação: {action_type}")
            
            # Marcar como processando
            if not self.mark_processing(visitor_id):
                logging.error(f"[ERRO] Falha ao marcar processando: {visitor_id}")
                return False
            
            logging.info(f"[STATUS] Item {visitor_id} marcado como processando")
            
            # ESTRATÉGIA SIMPLIFICADA - PASSAR DADOS DIRETAMENTE VIA JSON STRING
            visitor_data_json = json.dumps(visitor_data_temp, ensure_ascii=False)
            
            # Executar script - SEM ARQUIVOS TEMPORÁRIOS
            cmd = [
                'python', 
                self.script_path,
                '--visitor-id', str(visitor_id),
                '--headless'  # Modo headless para produção
            ]
            
            # ALTERNATIVA: Salvar dados em variável de ambiente
            env = os.environ.copy()
            env['VISITOR_DATA'] = visitor_data_json
            
            logging.info(f"[PROCESS] Executando: {' '.join(cmd)}")
            logging.info(f"[PROCESS] Dados do visitante passados via variável de ambiente")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutos timeout
                cwd=SCRIPT_DIR,  # FORÇAR WORKING DIRECTORY
                env=env  # Passar dados via ambiente
            )
            
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
        """Thread worker para processar itens da fila - SEM EMOJIS"""
        logging.info(f"[WORKER] Worker {worker_id} iniciado")
        
        while True:
            try:
                # Aguardar item na fila (timeout para evitar travamento)
                try:
                    item = work_queue.get(timeout=5)
                except queue.Empty:
                    continue
                
                with worker_lock:
                    logging.info(f"[WORKER] Worker {worker_id} processando: {item.get('id', 'unknown')}")
                
                # Processar visitante
                success = self.process_visitor(item)
                
                with worker_lock:
                    if success:
                        logging.info(f"[SUCCESS] Worker {worker_id} completou: {item.get('id', 'unknown')}")
                    else:
                        logging.error(f"[FAILED] Worker {worker_id} falhou: {item.get('id', 'unknown')}")
                
                # Marcar tarefa como concluída
                work_queue.task_done()
                
            except Exception as e:
                logging.error(f"[ERROR] Worker {worker_id} erro: {e}")
                work_queue.task_done()

    def test_api_connection(self):
        """Testar conexão com API local"""
        try:
            url = f"{self.api_base_url}/health"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                logging.info("[OK] API local está funcionando")
                return True
            else:
                logging.error(f"[ERRO] API local retornou: {response.status_code}")
                return False
        except Exception as e:
            logging.error(f"[ERRO] Não foi possível conectar na API local: {e}")
            logging.error("[HELP] Certifique-se que secure-api-simple.py está rodando")
            return False

    def test_token_authentication(self):
        """Testar autenticação do token"""
        try:
            url = f"{self.api_base_url}/api/visitante"
            response = requests.get(url, headers=self.headers, timeout=5)
            
            if response.status_code == 200:
                logging.info("[OK] Token autenticado com sucesso")
                return True
            elif response.status_code == 401:
                logging.error(f"[ERRO] Token rejeitado - verificar api_tokens_CONFIDENTIAL.json")
                logging.error(f"[DEBUG] Token usado: {self.system_token}")
                return False
            else:
                logging.error(f"[ERRO] Resposta inesperada: {response.status_code}")
                return False
        except Exception as e:
            logging.error(f"[ERRO] Erro ao testar token: {e}")
            return False

    def run(self):
        """Loop principal do serviço com 2 workers - SEM EMOJIS"""
        logging.info("[INFO] Iniciando POLLING SERVICE para Windows...")
        
        # Testar conexão com API antes de iniciar
        if not self.test_api_connection():
            logging.error("[ERRO] API local não está disponível - abortando")
            return
        
        # Testar autenticação do token
        if not self.test_token_authentication():
            logging.error("[ERRO] Falha na autenticação - verifique token")
            return
        
        # Iniciar 2 workers
        for worker_id in range(1, 3):  # Workers 1 e 2
            worker = threading.Thread(
                target=self.worker_thread,
                args=(worker_id,),
                daemon=True
            )
            worker.start()
            logging.info(f"[OK] Worker {worker_id} thread iniciada")
        
        # Loop principal - alimenta a fila
        consecutive_errors = 0
        while True:
            try:
                # Verificar fila de até 2 itens
                items = self.check_queue(limit=2)
                
                if items:
                    logging.info(f"[QUEUE] {len(items)} item(s) encontrado(s)")
                    consecutive_errors = 0  # Reset contador de erros
                    
                    # Adicionar itens à fila de workers
                    for item in items:
                        work_queue.put(item)
                        logging.info(f"[QUEUE] Item {item.get('id', 'unknown')} adicionado à fila de workers")
                else:
                    logging.info("[QUEUE] Fila vazia")
                    logging.info("[INFO] Aguardando novos itens...")
                
                # Aguardar antes da próxima verificação
                time.sleep(15)  # Verificar a cada 15 segundos
                
            except KeyboardInterrupt:
                logging.info("[INFO] Servico interrompido pelo usuario")
                break
            except Exception as e:
                consecutive_errors += 1
                logging.error(f"[ERRO] Erro no loop principal: {e}")
                
                if consecutive_errors >= 5:
                    logging.error("[ERRO] Muitos erros consecutivos - aumentando intervalo")
                    time.sleep(60)  # Aguardar 1 minuto em caso de muitos erros
                else:
                    time.sleep(5)

if __name__ == "__main__":
    service = WindowsPollingService()
    service.run()

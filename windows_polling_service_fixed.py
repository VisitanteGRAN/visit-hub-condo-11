#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WINDOWS POLLING SERVICE - SEM EMOJIS PARA WINDOWS
================================================
Este script roda 24/7 no Windows, verificando a fila de cadastros
SEM expor o Windows publicamente
"""

import time
import json
import os
import sys
import logging
import subprocess
import tempfile
from datetime import datetime
import requests
from typing import Optional, Dict, Any

# Carregar variáveis de ambiente do arquivo .env
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[OK] Arquivo .env carregado com sucesso")
except ImportError:
    print("[WARN] python-dotenv nao instalado. Execute: pip install python-dotenv")
except Exception as e:
    print(f"[WARN] Erro ao carregar .env: {e}")

# Configuração de logging SEM EMOJIS
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('windows_polling.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

class SupabaseQueue:
    """Cliente para interagir com fila do Supabase"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase URL e Service Key são obrigatórios")
        
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        logging.info("[OK] Cliente Supabase inicializado")
    
    def get_next_queue_item(self) -> Optional[Dict[Any, Any]]:
        """Buscar próximo item da fila"""
        try:
            # Chamar função do PostgreSQL para pegar próximo item
            response = requests.post(
                f"{self.supabase_url}/rest/v1/rpc/get_next_queue_item",
                headers=self.headers,
                timeout=30
            )
            
                                     if response.status_code == 200:
                data = response.json()
                # Verificar se há dados válidos
                if data and isinstance(data, dict) and data.get('id'):
                    logging.info(f"[INFO] Item da fila obtido: {data.get('id')}")
                    return data
                else:
                    logging.info("[INFO] Nenhum item na fila")
                    return None
            elif response.status_code == 204:  # 204 = sem itens
                logging.info("[INFO] Fila vazia")
                return None
            else:
                logging.warning(f"[WARN] Erro ao buscar fila: {response.status_code}")
                return None
                
        except Exception as e:
            logging.error(f"[ERROR] Erro na conexao Supabase: {e}")
            return None
    
    def mark_completed(self, item_id: str):
        """Marcar item como concluído"""
        try:
            response = requests.post(
                f"{self.supabase_url}/rest/v1/rpc/mark_queue_item_completed",
                headers=self.headers,
                json={'item_id': item_id},
                timeout=30
            )
            
            if response.status_code == 200:
                logging.info(f"[OK] Item {item_id} marcado como concluido")
            else:
                logging.warning(f"[WARN] Erro ao marcar concluido: {response.status_code}")
                
        except Exception as e:
            logging.error(f"[ERROR] Erro ao marcar concluido: {e}")
    
    def mark_failed(self, item_id: str, error_message: str):
        """Marcar item como falhado"""
        try:
            response = requests.post(
                f"{self.supabase_url}/rest/v1/rpc/mark_queue_item_failed",
                headers=self.headers,
                json={
                    'item_id': item_id,
                    'error_msg': error_message
                },
                timeout=30
            )
            
            if response.status_code == 200:
                logging.info(f"[FAIL] Item {item_id} marcado como falhado")
            else:
                logging.warning(f"[WARN] Erro ao marcar falhado: {response.status_code}")
                
        except Exception as e:
            logging.error(f"[ERROR] Erro ao marcar falhado: {e}")

class HikCentralProcessor:
    """Processador de cadastros do HikCentral"""
    
    def __init__(self):
        self.script_path = os.path.join(os.getcwd(), 'test_hikcentral_final_windows.py')
        
        if not os.path.exists(self.script_path):
            raise FileNotFoundError(f"Script nao encontrado: {self.script_path}")
        
        logging.info(f"[OK] Processador HikCentral pronto: {self.script_path}")
    
    def process_visitor(self, queue_item: Dict[Any, Any]) -> bool:
        """Processar cadastro de visitante"""
        if not queue_item:
            logging.error("[ERROR] Item da fila eh None")
            return False
            
        item_id = queue_item.get('id')
        visitor_data = queue_item.get('visitor_data', {})
        photo_base64 = queue_item.get('photo_base64')
        
        if not visitor_data:
            logging.error(f"[ERROR] Dados do visitante vazio para item {item_id}")
            return False
        
        logging.info(f"[INFO] Processando visitante: {visitor_data.get('name', 'N/A')}")
        
        try:
            # Preparar dados para o script
            script_data = {
                'name': visitor_data.get('name'),
                'phone': visitor_data.get('phone'),
                'rg': visitor_data.get('rg', ''),
                'placa': visitor_data.get('placa', ''),
                'photo_path': None
            }
            
            # Salvar foto se fornecida
            if photo_base64:
                photo_path = self._save_photo(photo_base64, item_id)
                if photo_path:
                    script_data['photo_path'] = photo_path
            
            # Criar arquivo temporário com dados
            temp_file = self._create_temp_file(script_data, item_id)
            
            # Executar script
            success = self._execute_script(temp_file, item_id)
            
            # Limpeza
            self._cleanup_temp_files(temp_file, script_data.get('photo_path'))
            
            return success
            
        except Exception as e:
            logging.error(f"[ERROR] Erro ao processar {item_id}: {e}")
            return False
    
    def _save_photo(self, photo_base64: str, item_id: str) -> Optional[str]:
        """Salvar foto base64 em arquivo temporário"""
        try:
            import base64
            
            # Decodificar base64
            photo_data = base64.b64decode(photo_base64)
            
            # Salvar em arquivo temporário
            temp_dir = tempfile.gettempdir()
            photo_path = os.path.join(temp_dir, f"visitor_photo_{item_id}.jpg")
            
            with open(photo_path, 'wb') as f:
                f.write(photo_data)
            
            logging.info(f"[INFO] Foto salva: {photo_path}")
            return photo_path
            
        except Exception as e:
            logging.error(f"[ERROR] Erro ao salvar foto: {e}")
            return None
    
    def _create_temp_file(self, visitor_data: Dict[Any, Any], item_id: str) -> str:
        """Criar arquivo temporário com dados do visitante"""
        temp_dir = tempfile.gettempdir()
        temp_file = os.path.join(temp_dir, f"visitor_data_{item_id}.json")
        
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(visitor_data, f, ensure_ascii=False, indent=2)
        
        logging.info(f"[INFO] Dados salvos: {temp_file}")
        return temp_file
    
    def _execute_script(self, temp_file: str, item_id: str) -> bool:
        """Executar script do HikCentral"""
        try:
            # Comando para executar
            python_cmd = 'python' if os.name == 'nt' else 'python3'
            cmd = [
                python_cmd,
                self.script_path,
                '--visitor-data', temp_file,
                '--visitor-id', item_id,
                '--headless'
            ]
            
            logging.info(f"[INFO] Executando: {' '.join(cmd)}")
            
            # Executar com timeout
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutos timeout
                cwd=os.getcwd(),
                encoding='utf-8',
                errors='replace'
            )
            
            # Log do resultado
            logging.info(f"[INFO] Codigo de saida: {result.returncode}")
            
            if result.stdout:
                logging.info(f"[INFO] STDOUT: {result.stdout}")
            
            if result.stderr:
                logging.warning(f"[WARN] STDERR: {result.stderr}")
            
            # Verificar sucesso
            success = result.returncode == 0
            
            if success:
                logging.info(f"[SUCCESS] Visitante {item_id} cadastrado com sucesso!")
            else:
                logging.error(f"[FAIL] Falha no cadastro {item_id}")
            
            return success
            
        except subprocess.TimeoutExpired:
            logging.error(f"[ERROR] Timeout no script para {item_id}")
            return False
        except Exception as e:
            logging.error(f"[ERROR] Erro na execucao: {e}")
            return False
    
    def _cleanup_temp_files(self, temp_file: str, photo_path: Optional[str]):
        """Limpar arquivos temporários"""
        try:
            if os.path.exists(temp_file):
                os.remove(temp_file)
                logging.info(f"[INFO] Arquivo removido: {temp_file}")
            
            if photo_path and os.path.exists(photo_path):
                os.remove(photo_path)
                logging.info(f"[INFO] Foto removida: {photo_path}")
                
        except Exception as e:
            logging.warning(f"[WARN] Erro na limpeza: {e}")

class WindowsPollingService:
    """Serviço principal de polling"""
    
    def __init__(self):
        self.queue = SupabaseQueue()
        self.processor = HikCentralProcessor()
        self.poll_interval = int(os.getenv('POLL_INTERVAL', '30'))  # 30 segundos
        self.running = True
        
        logging.info(f"[OK] Servico iniciado - Polling a cada {self.poll_interval}s")
    
    def run(self):
        """Loop principal do serviço"""
        logging.info("[INFO] Iniciando polling loop...")
        
        while self.running:
            try:
                # Buscar próximo item
                queue_item = self.queue.get_next_queue_item()
                
                if queue_item:
                    # Processar item
                    success = self.processor.process_visitor(queue_item)
                    
                    # Atualizar status
                    item_id = queue_item.get('id')
                    if success:
                        self.queue.mark_completed(item_id)
                    else:
                        self.queue.mark_failed(item_id, "Erro no processamento")
                else:
                    # Sem itens, aguardar
                    logging.info("[INFO] Nenhum item na fila, aguardando...")
                
                # Aguardar próximo ciclo
                time.sleep(self.poll_interval)
                
            except KeyboardInterrupt:
                logging.info("[INFO] Interrupcao manual recebida")
                self.running = False
            except Exception as e:
                logging.error(f"[ERROR] Erro no loop principal: {e}")
                time.sleep(self.poll_interval)
        
        logging.info("[INFO] Servico finalizado")

def main():
    """Função principal"""
    print("WINDOWS POLLING SERVICE - VISIT HUB")
    print("=" * 50)
    print("[OK] Arquitetura SEGURA - Windows NAO exposto!")
    print("[INFO] Verificando fila de cadastros...")
    print("=" * 50)
    
    try:
        # Verificar variáveis de ambiente
        required_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if missing_vars:
            print(f"[ERROR] Variaveis de ambiente obrigatorias: {missing_vars}")
            print("[INFO] Configure no arquivo .env:")
            print("   SUPABASE_URL=https://xxx.supabase.co")
            print("   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1...")
            return False
        
        # Iniciar serviço
        service = WindowsPollingService()
        service.run()
        
        return True
        
    except Exception as e:
        logging.error(f"[ERROR] Erro fatal: {e}")
        return False

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WINDOWS POLLING SERVICE - VERSÃO COM TEMP CORRIGIDO
==================================================
"""

import time
import json
import os
import sys
import logging
import subprocess
import requests
from typing import Optional, Dict, Any

# Carregar .env
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[OK] Arquivo .env carregado")
except:
    print("[WARN] Erro ao carregar .env")

# Logging simples
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler('polling.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

def get_supabase_headers():
    """Obter headers do Supabase"""
    service_key = os.getenv('SUPABASE_SERVICE_KEY')
    return {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json'
    }

def check_queue():
    """Verificar se há itens na fila"""
    try:
        url = os.getenv('SUPABASE_URL')
        headers = get_supabase_headers()
        
        response = requests.get(
            f"{url}/rest/v1/visitor_registration_queue?status=eq.pending&limit=1",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                item = data[0]
                logging.info(f"[QUEUE] Item encontrado: {item.get('id')}")
                return item
            else:
                logging.info("[QUEUE] Fila vazia")
                return None
        else:
            logging.warning(f"[QUEUE] Erro HTTP: {response.status_code}")
            return None
            
    except Exception as e:
        logging.error(f"[QUEUE] Erro: {e}")
        return None

def mark_processing(item_id):
    """Marcar item como sendo processado"""
    try:
        url = os.getenv('SUPABASE_URL')
        headers = get_supabase_headers()
        
        response = requests.patch(
            f"{url}/rest/v1/visitor_registration_queue?id=eq.{item_id}",
            headers=headers,
            json={'status': 'processing'},
            timeout=30
        )
        
        if response.status_code == 204:
            logging.info(f"[STATUS] Item {item_id} marcado como processando")
            return True
        else:
            logging.warning(f"[STATUS] Erro ao marcar processando: {response.status_code}")
            return False
            
    except Exception as e:
        logging.error(f"[STATUS] Erro: {e}")
        return False

def mark_completed(item_id):
    """Marcar item como concluído"""
    try:
        url = os.getenv('SUPABASE_URL')
        headers = get_supabase_headers()
        
        response = requests.patch(
            f"{url}/rest/v1/visitor_registration_queue?id=eq.{item_id}",
            headers=headers,
            json={
                'status': 'completed',
                'processed_at': 'now()'
            },
            timeout=30
        )
        
        if response.status_code == 204:
            logging.info(f"[STATUS] Item {item_id} concluido")
            return True
        else:
            logging.warning(f"[STATUS] Erro ao marcar concluido: {response.status_code}")
            return False
            
    except Exception as e:
        logging.error(f"[STATUS] Erro: {e}")
        return False

def mark_failed(item_id, error_msg):
    """Marcar item como falhado"""
    try:
        url = os.getenv('SUPABASE_URL')
        headers = get_supabase_headers()
        
        response = requests.patch(
            f"{url}/rest/v1/visitor_registration_queue?id=eq.{item_id}",
            headers=headers,
            json={
                'status': 'failed',
                'error_message': error_msg
            },
            timeout=30
        )
        
        if response.status_code == 204:
            logging.info(f"[STATUS] Item {item_id} marcado como falhado")
            return True
        else:
            logging.warning(f"[STATUS] Erro ao marcar falhado: {response.status_code}")
            return False
            
    except Exception as e:
        logging.error(f"[STATUS] Erro: {e}")
        return False

def process_visitor(queue_item):
    """Processar visitante"""
    try:
        item_id = queue_item.get('id')
        visitor_data = queue_item.get('visitor_data', {})
        
        if not visitor_data:
            logging.error(f"[PROCESS] Dados vazios para {item_id}")
            return False
        
        name = visitor_data.get('name', 'N/A')
        logging.info(f"[PROCESS] Processando: {name}")
        
        # Marcar como processando
        mark_processing(item_id)
        
        # CORRIGIR: Usar diretório atual em vez de temp do sistema
        work_dir = os.getcwd()
        
        # Salvar foto se fornecida
        photo_path = None
        if queue_item.get('photo_base64'):
            try:
                import base64
                photo_data = base64.b64decode(queue_item.get('photo_base64'))
                photo_path = os.path.join(work_dir, f"visitor_photo_{item_id}.jpg")
                
                with open(photo_path, 'wb') as f:
                    f.write(photo_data)
                
                logging.info(f"[PROCESS] Foto salva: {photo_path}")
            except Exception as e:
                logging.error(f"[ERROR] Erro ao salvar foto: {e}")
        
        # Preparar dados para script
        script_data = {
            'name': visitor_data.get('name'),
            'phone': visitor_data.get('phone'),
            'rg': visitor_data.get('rg', ''),
            'placa': visitor_data.get('placa', ''),
            'photo_path': photo_path
        }
        
        # Salvar dados em arquivo temporário NO DIRETÓRIO ATUAL
        temp_file = os.path.join(work_dir, f"visitor_data_{item_id}.json")
        
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(script_data, f, ensure_ascii=False, indent=2)
        
        logging.info(f"[PROCESS] Dados salvos: {temp_file}")
        
        # Executar script HikCentral
        script_path = 'test_simple_no_photo.py'  # Usar script simples primeiro
        cmd = [
            'python',
            script_path,
            '--visitor-data', temp_file,
            '--visitor-id', item_id
        ]
        
        logging.info(f"[PROCESS] Executando: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
            encoding='utf-8',
            errors='replace'
        )
        
        # Limpar arquivos temporários
        try:
            os.remove(temp_file)
            if photo_path and os.path.exists(photo_path):
                os.remove(photo_path)
        except:
            pass
        
        # Verificar resultado
        success = result.returncode == 0
        
        if success:
            logging.info(f"[PROCESS] Sucesso para {item_id}")
            logging.info(f"[PROCESS] STDOUT: {result.stdout}")
        else:
            logging.error(f"[PROCESS] Falha para {item_id}")
            logging.error(f"[PROCESS] STDERR: {result.stderr}")
        
        return success
        
    except Exception as e:
        logging.error(f"[PROCESS] Erro: {e}")
        return False

def main():
    """Loop principal"""
    print("WINDOWS POLLING SERVICE - TEMP CORRIGIDO")
    print("=" * 50)
    
    # Verificar configuração
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_SERVICE_KEY'):
        print("[ERROR] Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env")
        return
    
    print("[OK] Configuracao carregada")
    print(f"[INFO] Diretorio de trabalho: {os.getcwd()}")
    print("[INFO] Iniciando polling...")
    
    poll_interval = int(os.getenv('POLL_INTERVAL', '30'))
    
    while True:
        try:
            # Verificar fila
            queue_item = check_queue()
            
            if queue_item:
                # Processar item
                success = process_visitor(queue_item)
                
                # Atualizar status
                item_id = queue_item.get('id')
                if success:
                    mark_completed(item_id)
                else:
                    mark_failed(item_id, "Erro no processamento")
            else:
                logging.info("[INFO] Aguardando novos itens...")
            
            # Aguardar próximo ciclo
            time.sleep(poll_interval)
            
        except KeyboardInterrupt:
            print("\n[INFO] Interrompido pelo usuario")
            break
        except Exception as e:
            logging.error(f"[ERROR] Erro no loop: {e}")
            time.sleep(poll_interval)

if __name__ == "__main__":
    main() 
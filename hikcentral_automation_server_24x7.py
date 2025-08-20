#!/usr/bin/env python3
"""
Servidor de Automação HikCentral - Versão 24/7
Suporte para múltiplos cadastros simultâneos e recuperação automática
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
import threading
import time
import logging
import queue
import sqlite3
from datetime import datetime
from dotenv import load_dotenv
from hikcentral_automation import HikCentralAutomation

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('automation.log'),
        logging.StreamHandler()
    ]
)

# Carregar variáveis de ambiente
load_dotenv('hikcentral_automation_config.env')

app = Flask(__name__)
CORS(app)

# Configurações
API_KEY = os.getenv('HIKCENTRAL_AUTOMATION_API_KEY', 'automation-key-2024')
PORT = int(os.getenv('HIKCENTRAL_AUTOMATION_PORT', 5001))
AUTO_RESTART = os.getenv('HIKCENTRAL_AUTO_RESTART', 'true').lower() == 'true'
QUEUE_PROCESSING = os.getenv('HIKCENTRAL_QUEUE_PROCESSING', 'true').lower() == 'true'

# Fila global para processamento
automation_queue = queue.Queue()
automation_status = {}
automation_lock = threading.Lock()

class AutomationDatabase:
    """Banco de dados SQLite para persistir cadastros pendentes"""
    
    def __init__(self, db_path='automation.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Inicializa o banco de dados"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS pending_automations (
                id TEXT PRIMARY KEY,
                visitor_data TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                retry_count INTEGER DEFAULT 0,
                last_error TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        logging.info("Database initialized")
    
    def add_pending(self, visitor_id, visitor_data):
        """Adiciona um cadastro pendente"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO pending_automations 
            (id, visitor_data, status, created_at, updated_at)
            VALUES (?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', (visitor_id, json.dumps(visitor_data)))
        
        conn.commit()
        conn.close()
        logging.info(f"Added pending automation for visitor {visitor_id}")
    
    def get_pending(self):
        """Recupera todos os cadastros pendentes"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, visitor_data, retry_count 
            FROM pending_automations 
            WHERE status = 'pending' 
            ORDER BY created_at ASC
        ''')
        
        results = cursor.fetchall()
        conn.close()
        
        pending = []
        for row in results:
            pending.append({
                'visitor_id': row[0],
                'visitor_data': json.loads(row[1]),
                'retry_count': row[2]
            })
        
        return pending
    
    def update_status(self, visitor_id, status, error=None):
        """Atualiza o status de um cadastro"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if status == 'completed':
            cursor.execute('''
                DELETE FROM pending_automations WHERE id = ?
            ''', (visitor_id,))
        else:
            cursor.execute('''
                UPDATE pending_automations 
                SET status = ?, updated_at = CURRENT_TIMESTAMP, last_error = ?,
                    retry_count = retry_count + 1
                WHERE id = ?
            ''', (status, error, visitor_id))
        
        conn.commit()
        conn.close()
        logging.info(f"Updated status for visitor {visitor_id}: {status}")

class AutomationQueueManager:
    """Gerenciador de fila de automação com processamento simultâneo"""
    
    def __init__(self, max_workers=3):
        self.max_workers = max_workers
        self.workers = []
        self.running = True
        self.db = AutomationDatabase()
        self.active_automations = {}
        
        # Recuperar cadastros pendentes após reinicialização
        self.recover_pending_automations()
        
        # Iniciar workers
        self.start_workers()
    
    def recover_pending_automations(self):
        """Recupera cadastros pendentes após reinicialização"""
        try:
            pending = self.db.get_pending()
            logging.info(f"Recovering {len(pending)} pending automations")
            
            for item in pending:
                if item['retry_count'] < 3:  # Máximo 3 tentativas
                    automation_queue.put({
                        'visitor_id': item['visitor_id'],
                        'visitor_data': item['visitor_data'],
                        'retry': True
                    })
                    logging.info(f"Re-queued automation for visitor {item['visitor_id']}")
                else:
                    self.db.update_status(item['visitor_id'], 'failed', 'Max retries exceeded')
                    logging.warning(f"Max retries exceeded for visitor {item['visitor_id']}")
        
        except Exception as e:
            logging.error(f"Error recovering pending automations: {e}")
    
    def start_workers(self):
        """Inicia os workers de processamento"""
        for i in range(self.max_workers):
            worker = threading.Thread(target=self.worker_process, args=(i,))
            worker.daemon = True
            worker.start()
            self.workers.append(worker)
            logging.info(f"Started worker {i}")
    
    def worker_process(self, worker_id):
        """Processo de worker para executar automações"""
        logging.info(f"Worker {worker_id} started")
        
        while self.running:
            try:
                # Aguardar item na fila (timeout para verificar se deve parar)
                try:
                    item = automation_queue.get(timeout=5)
                except queue.Empty:
                    continue
                
                visitor_id = item['visitor_id']
                visitor_data = item['visitor_data']
                is_retry = item.get('retry', False)
                
                logging.info(f"Worker {worker_id} processing visitor {visitor_id}")
                
                # Marcar como em processamento
                with automation_lock:
                    self.active_automations[visitor_id] = {
                        'worker_id': worker_id,
                        'status': 'processing',
                        'start_time': datetime.now().isoformat()
                    }
                
                # Adicionar ao banco como pendente (se não for retry)
                if not is_retry:
                    self.db.add_pending(visitor_id, visitor_data)
                
                # Executar automação
                success = self.execute_automation(visitor_id, visitor_data, worker_id)
                
                # Atualizar status
                with automation_lock:
                    if success:
                        self.active_automations[visitor_id]['status'] = 'completed'
                        self.db.update_status(visitor_id, 'completed')
                        logging.info(f"Worker {worker_id} completed visitor {visitor_id}")
                    else:
                        self.active_automations[visitor_id]['status'] = 'failed'
                        self.db.update_status(visitor_id, 'failed', 'Automation execution failed')
                        logging.error(f"Worker {worker_id} failed visitor {visitor_id}")
                
                # Remover do tracking após um tempo
                threading.Timer(300, self.cleanup_completed_automation, args=(visitor_id,)).start()
                
                automation_queue.task_done()
                
            except Exception as e:
                logging.error(f"Worker {worker_id} error: {e}")
                if 'visitor_id' in locals():
                    with automation_lock:
                        if visitor_id in self.active_automations:
                            self.active_automations[visitor_id]['status'] = 'error'
                    self.db.update_status(visitor_id, 'failed', str(e))
    
    def cleanup_completed_automation(self, visitor_id):
        """Remove automação concluída do tracking"""
        with automation_lock:
            if visitor_id in self.active_automations:
                del self.active_automations[visitor_id]
    
    def execute_automation(self, visitor_id, visitor_data, worker_id):
        """Executa a automação"""
        try:
            automation = HikCentralAutomation()
            automation.setup_driver()
            
            # Converter formato para o esperado pelo script
            automation_data = {
                'name': visitor_data.get('name', ''),
                'cpf': visitor_data.get('cpf', ''),
                'phone': visitor_data.get('phone', ''),
                'email': visitor_data.get('email', ''),
                'placa_veiculo': visitor_data.get('placa_veiculo', '')
            }
            
            result = automation.register_visitor(automation_data)
            automation.close()
            
            return result.get('success', False)
            
        except Exception as e:
            logging.error(f"Automation execution error for visitor {visitor_id}: {e}")
            return False
    
    def add_to_queue(self, visitor_id, visitor_data):
        """Adiciona item à fila de processamento"""
        automation_queue.put({
            'visitor_id': visitor_id,
            'visitor_data': visitor_data,
            'retry': False
        })
        logging.info(f"Added visitor {visitor_id} to automation queue")
    
    def get_status(self, visitor_id):
        """Obtém status de uma automação"""
        with automation_lock:
            if visitor_id in self.active_automations:
                return self.active_automations[visitor_id]
        
        # Verificar no banco de dados
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT status, updated_at FROM pending_automations WHERE id = ?', (visitor_id,))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'status': result[0],
                'updated_at': result[1]
            }
        
        return None
    
    def get_queue_stats(self):
        """Retorna estatísticas da fila"""
        with automation_lock:
            active_count = len(self.active_automations)
        
        queue_size = automation_queue.qsize()
        
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM pending_automations WHERE status = "pending"')
        pending_count = cursor.fetchone()[0]
        conn.close()
        
        return {
            'queue_size': queue_size,
            'active_automations': active_count,
            'pending_in_db': pending_count,
            'max_workers': self.max_workers
        }

# Inicializar gerenciador de fila
queue_manager = AutomationQueueManager(max_workers=3)

def require_api_key(f):
    """Decorator para verificar API key"""
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
        if api_key != API_KEY:
            return jsonify({'error': 'Invalid API key'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    stats = queue_manager.get_queue_stats()
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'queue_stats': stats,
        'auto_restart': AUTO_RESTART,
        'queue_processing': QUEUE_PROCESSING
    })

@app.route('/api/hikcentral/automation', methods=['POST'])
@require_api_key
def start_automation():
    """Inicia automação de cadastro"""
    try:
        data = request.get_json()
        visitor_id = data.get('visitor_id')
        visitor_data = data.get('visitor_data', {})
        
        if not visitor_id or not visitor_data:
            return jsonify({'error': 'Missing visitor_id or visitor_data'}), 400
        
        # Adicionar à fila de processamento
        queue_manager.add_to_queue(visitor_id, visitor_data)
        
        return jsonify({
            'success': True,
            'message': f'Automation queued for visitor {visitor_id}',
            'visitor_id': visitor_id,
            'timestamp': datetime.now().isoformat(),
            'status': 'queued'
        })
        
    except Exception as e:
        logging.error(f"Error in start_automation: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/hikcentral/status/<visitor_id>', methods=['GET'])
@require_api_key
def get_automation_status(visitor_id):
    """Verifica status de automação"""
    try:
        status_info = queue_manager.get_status(visitor_id)
        
        if status_info:
            return jsonify({
                'visitor_id': visitor_id,
                'status': status_info['status'],
                'timestamp': datetime.now().isoformat(),
                **status_info
            })
        else:
            return jsonify({
                'visitor_id': visitor_id,
                'status': 'not_found',
                'timestamp': datetime.now().isoformat()
            }), 404
            
    except Exception as e:
        logging.error(f"Error in get_automation_status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/hikcentral/automations', methods=['GET'])
@require_api_key
def list_automations():
    """Lista todas as automações"""
    try:
        stats = queue_manager.get_queue_stats()
        
        with automation_lock:
            active_automations = dict(queue_manager.active_automations)
        
        return jsonify({
            'timestamp': datetime.now().isoformat(),
            'stats': stats,
            'active_automations': active_automations
        })
        
    except Exception as e:
        logging.error(f"Error in list_automations: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/hikcentral/queue/stats', methods=['GET'])
@require_api_key
def queue_stats():
    """Estatísticas detalhadas da fila"""
    try:
        stats = queue_manager.get_queue_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logging.info(f"Starting HikCentral Automation Server on port {PORT}")
    logging.info(f"Auto-restart: {AUTO_RESTART}")
    logging.info(f"Queue processing: {QUEUE_PROCESSING}")
    logging.info(f"Max workers: {queue_manager.max_workers}")
    
    try:
        app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
    except Exception as e:
        logging.error(f"Server error: {e}")
        if AUTO_RESTART:
            logging.info("Auto-restart enabled, restarting in 10 seconds...")
            time.sleep(10)
            os.execv(sys.executable, ['python'] + sys.argv) 
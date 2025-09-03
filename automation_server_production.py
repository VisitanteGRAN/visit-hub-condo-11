#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🏢 HIKCENTRAL AUTOMATION SERVER - PRODUÇÃO
==========================================
Servidor Flask para automação HikCentral com:
- Sistema de fila inteligente
- Processamento paralelo
- Recuperação automática após reinicialização
- Banco de dados persistente
- API completa
"""

import os
import sys
import json
import time
import queue
import sqlite3
import logging
import threading
import subprocess
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from functools import wraps

# Importar gerenciador de fotos
from photo_manager import PhotoManager, save_visitor_photo

# Configurar logging - Criar diretórios necessários
import os
os.makedirs('logs', exist_ok=True)
os.makedirs('photos', exist_ok=True)
os.makedirs('temp', exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/automation_server.log'),
        logging.StreamHandler()
    ]
)

# Configurações
API_KEY = os.getenv('API_KEY', 'hik_automation_2024_secure_key')
MAX_WORKERS = 3
RETRY_ATTEMPTS = 3
SCRIPT_PATH = './test_hikcentral_final_windows.py' if os.name == 'nt' else './test_real_hikcentral_automated.py'

# Flask app
app = Flask(__name__)

# Fila global e lock
automation_queue = queue.Queue()
automation_lock = threading.Lock()

class AutomationDatabase:
    """Gerenciador de banco de dados para automações"""
    
    def __init__(self, db_path='automation.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Inicializa o banco de dados"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS automations (
                id TEXT PRIMARY KEY,
                visitor_data TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                retry_count INTEGER DEFAULT 0,
                error_message TEXT,
                worker_id INTEGER,
                completed_at TIMESTAMP,
                photo_path TEXT,
                has_photo BOOLEAN DEFAULT 0
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS automation_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                automation_id TEXT,
                level TEXT,
                message TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (automation_id) REFERENCES automations (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS visitor_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                visitor_id TEXT NOT NULL,
                photo_path TEXT NOT NULL,
                file_size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        logging.info("✅ Banco de dados inicializado")
    
    def add_automation(self, visitor_id, visitor_data, photo_path=None):
        """Adiciona nova automação com suporte a foto"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        has_photo = 1 if photo_path else 0
        
        cursor.execute('''
            INSERT OR REPLACE INTO automations 
            (id, visitor_data, status, created_at, updated_at, photo_path, has_photo)
            VALUES (?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)
        ''', (visitor_id, json.dumps(visitor_data), photo_path, has_photo))
        
        conn.commit()
        conn.close()
        logging.info(f"✅ Automação {visitor_id} adicionada ao banco (foto: {'sim' if has_photo else 'não'})")
    
    def save_visitor_photo_record(self, visitor_id, photo_path, file_size, metadata=None):
        """Salva registro da foto no banco"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO visitor_photos (visitor_id, photo_path, file_size, metadata)
            VALUES (?, ?, ?, ?)
        ''', (visitor_id, photo_path, file_size, json.dumps(metadata) if metadata else None))
        
        conn.commit()
        conn.close()
        logging.info(f"✅ Registro de foto salvo para {visitor_id}")
    
    def update_status(self, visitor_id, status, error=None, worker_id=None):
        """Atualiza status da automação"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if status == 'completed':
            cursor.execute('''
                UPDATE automations 
                SET status = ?, updated_at = CURRENT_TIMESTAMP, 
                    completed_at = CURRENT_TIMESTAMP, worker_id = ?
                WHERE id = ?
            ''', (status, worker_id, visitor_id))
        else:
            cursor.execute('''
                UPDATE automations 
                SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP,
                    worker_id = ?
                WHERE id = ?
            ''', (status, error, worker_id, visitor_id))
        
        conn.commit()
        conn.close()
        logging.info(f"✅ Status atualizado para {visitor_id}: {status}")
    
    def increment_retry(self, visitor_id):
        """Incrementa contador de retry"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE automations 
            SET retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (visitor_id,))
        
        conn.commit()
        conn.close()
    
    def get_pending(self):
        """Recupera automações pendentes"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, visitor_data, retry_count 
            FROM automations 
            WHERE status IN ('pending', 'processing') 
            AND retry_count < ?
            ORDER BY created_at ASC
        ''', (RETRY_ATTEMPTS,))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                'visitor_id': row[0],
                'visitor_data': json.loads(row[1]),
                'retry_count': row[2]
            })
        
        conn.close()
        return results
    
    def get_status(self, visitor_id):
        """Obtém status de uma automação"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT status, created_at, updated_at, retry_count, 
                   error_message, worker_id, completed_at
            FROM automations WHERE id = ?
        ''', (visitor_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                'status': result[0],
                'created_at': result[1],
                'updated_at': result[2],
                'retry_count': result[3],
                'error_message': result[4],
                'worker_id': result[5],
                'completed_at': result[6]
            }
        return None
    
    def add_log(self, automation_id, level, message):
        """Adiciona log para uma automação"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO automation_logs (automation_id, level, message)
            VALUES (?, ?, ?)
        ''', (automation_id, level, message))
        
        conn.commit()
        conn.close()
    
    def get_stats(self):
        """Retorna estatísticas gerais"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM automations WHERE status = "pending"')
        pending = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM automations WHERE status = "processing"')
        processing = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM automations WHERE status = "completed"')
        completed = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM automations WHERE status = "failed"')
        failed = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT COUNT(*) FROM automations 
            WHERE created_at >= datetime('now', '-24 hours')
        ''')
        last_24h = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'pending': pending,
            'processing': processing,
            'completed': completed,
            'failed': failed,
            'last_24h': last_24h,
            'total': pending + processing + completed + failed
        }

class AutomationQueueManager:
    """Gerenciador avançado de fila com recuperação automática"""
    
    def __init__(self, max_workers=MAX_WORKERS):
        self.max_workers = max_workers
        self.workers = []
        self.running = True
        self.db = AutomationDatabase()
        self.active_automations = {}
        self.photo_manager = PhotoManager()
        
        # Recuperar pendências após reinicialização
        self.recover_pending_automations()
        
        # Iniciar workers
        self.start_workers()
        
        logging.info(f"✅ AutomationQueueManager iniciado com {max_workers} workers")
    
    def recover_pending_automations(self):
        """Recupera automações pendentes após reinicialização"""
        try:
            pending = self.db.get_pending()
            logging.info(f"🔄 Recuperando {len(pending)} automações pendentes")
            
            for item in pending:
                automation_queue.put({
                    'visitor_id': item['visitor_id'],
                    'visitor_data': item['visitor_data'],
                    'retry': True
                })
                logging.info(f"✅ Automação {item['visitor_id']} re-adicionada à fila")
                
        except Exception as e:
            logging.error(f"❌ Erro ao recuperar automações pendentes: {e}")
    
    def start_workers(self):
        """Inicia workers de processamento"""
        for i in range(self.max_workers):
            worker = threading.Thread(target=self.worker_process, args=(i,))
            worker.daemon = True
            worker.start()
            self.workers.append(worker)
            logging.info(f"✅ Worker {i} iniciado")
    
    def worker_process(self, worker_id):
        """Processo principal do worker"""
        logging.info(f"🚀 Worker {worker_id} ativo")
        
        while self.running:
            try:
                # Aguardar item na fila
                try:
                    item = automation_queue.get(timeout=5)
                except queue.Empty:
                    continue
                
                visitor_id = item['visitor_id']
                visitor_data = item['visitor_data']
                is_retry = item.get('retry', False)
                
                logging.info(f"🔄 Worker {worker_id} processando visitante {visitor_id}")
                
                # Registrar como ativo
                with automation_lock:
                    self.active_automations[visitor_id] = {
                        'worker_id': worker_id,
                        'status': 'processing',
                        'start_time': datetime.now().isoformat()
                    }
                
                # Atualizar banco
                if not is_retry:
                    self.db.add_automation(visitor_id, visitor_data)
                else:
                    self.db.increment_retry(visitor_id)
                
                self.db.update_status(visitor_id, 'processing', worker_id=worker_id)
                
                # Executar automação
                success = self.execute_automation(visitor_id, visitor_data, worker_id)
                
                # Atualizar resultado
                with automation_lock:
                    if success:
                        self.active_automations[visitor_id]['status'] = 'completed'
                        self.db.update_status(visitor_id, 'completed', worker_id=worker_id)
                        self.db.add_log(visitor_id, 'INFO', 'Automação concluída com sucesso')
                        logging.info(f"✅ Worker {worker_id} - Visitante {visitor_id} cadastrado com sucesso")
                    else:
                        self.active_automations[visitor_id]['status'] = 'failed'
                        self.db.update_status(visitor_id, 'failed', 'Erro na execução da automação', worker_id)
                        self.db.add_log(visitor_id, 'ERROR', 'Falha na execução da automação')
                        logging.error(f"❌ Worker {worker_id} - Falha no visitante {visitor_id}")
                
                # Limpeza após processamento
                threading.Timer(60.0, self.cleanup_active_automation, [visitor_id]).start()
                
                # Finalizar item da fila
                automation_queue.task_done()
                
            except Exception as e:
                logging.error(f"❌ Erro no worker {worker_id}: {e}")
                if 'visitor_id' in locals():
                    self.db.update_status(visitor_id, 'failed', str(e), worker_id)
                    self.db.add_log(visitor_id, 'ERROR', f'Erro crítico: {str(e)}')
    
    def execute_automation(self, visitor_id, visitor_data, worker_id):
        """Executa o script de automação com suporte a foto"""
        try:
            logging.info(f"🚀 Worker {worker_id} executando script para {visitor_id}")
            
            # Preparar dados para o script
            script_data = {
                'name': visitor_data.get('name', ''),
                'phone': visitor_data.get('phone', ''),
                'rg': visitor_data.get('rg', visitor_data.get('cpf', ''))[:8],
                'placa': visitor_data.get('placa', visitor_data.get('placa_veiculo', ''))
            }
            
            # Verificar se há foto para este visitante
            photo_path = None
            if visitor_data.get('photo_base64'):
                # Salvar foto temporária para a automação
                photo_path = self.photo_manager.save_photo_for_automation(
                    visitor_id, 
                    visitor_data['photo_base64']
                )
                if photo_path:
                    script_data['photo_path'] = photo_path
                    logging.info(f"📸 Foto preparada para automação: {photo_path}")
            
            # Salvar dados temporários (compatível Windows/Linux)
            import tempfile
            temp_file = os.path.join(tempfile.gettempdir(), f'visitor_data_{visitor_id}.json')
            with open(temp_file, 'w') as f:
                json.dump(script_data, f)
            
            # Executar script (compatível Windows/Linux)
            python_cmd = 'python' if os.name == 'nt' else 'python3'
            cmd = [
                python_cmd, SCRIPT_PATH,
                '--visitor-data', temp_file,
                '--visitor-id', visitor_id,
                '--headless'
            ]
            
            logging.info(f"🚀 Executando comando: {' '.join(cmd)}")
            logging.info(f"📂 Arquivo de dados: {temp_file}")
            logging.info(f"📁 Diretório atual: {os.getcwd()}")
            logging.info(f"📄 Script existe: {os.path.exists(SCRIPT_PATH)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutos timeout
            )
            
            # Log completo da saída
            logging.info(f"📊 Código de retorno: {result.returncode}")
            if result.stdout:
                logging.info(f"📋 STDOUT do script:\n{result.stdout}")
            if result.stderr:
                logging.error(f"📋 STDERR do script:\n{result.stderr}")
            
            # Limpar arquivos temporários
            if os.path.exists(temp_file):
                os.remove(temp_file)
                logging.info(f"🗑️ Arquivo temporário removido")
            
            if photo_path and os.path.exists(photo_path):
                os.remove(photo_path)
                logging.info(f"🗑️ Foto temporária removida: {photo_path}")
            
            # Verificar resultado
            if result.returncode == 0:
                logging.info(f"✅ Script executado com sucesso para {visitor_id}")
                self.db.add_log(visitor_id, 'INFO', f'Output: {result.stdout}')
                return True
            else:
                logging.error(f"❌ Script falhou para {visitor_id}: {result.stderr}")
                self.db.add_log(visitor_id, 'ERROR', f'Stderr: {result.stderr}')
                return False
                
        except subprocess.TimeoutExpired:
            logging.error(f"⏰ Timeout na execução do script para {visitor_id}")
            self.db.add_log(visitor_id, 'ERROR', 'Timeout na execução')
            return False
        except Exception as e:
            logging.error(f"❌ Erro ao executar script para {visitor_id}: {e}")
            self.db.add_log(visitor_id, 'ERROR', f'Erro de execução: {str(e)}')
            return False
    
    def cleanup_active_automation(self, visitor_id):
        """Remove automação da lista ativa após completar"""
        with automation_lock:
            if visitor_id in self.active_automations:
                del self.active_automations[visitor_id]
    
    def add_to_queue(self, visitor_id, visitor_data):
        """Adiciona automação à fila"""
        automation_queue.put({
            'visitor_id': visitor_id,
            'visitor_data': visitor_data,
            'retry': False
        })
        logging.info(f"➕ Visitante {visitor_id} adicionado à fila")
    
    def get_status(self, visitor_id):
        """Obtém status completo de uma automação"""
        # Verificar se está ativo
        with automation_lock:
            if visitor_id in self.active_automations:
                active_info = self.active_automations[visitor_id]
                db_info = self.db.get_status(visitor_id)
                
                if db_info:
                    active_info.update(db_info)
                
                return active_info
        
        # Buscar no banco
        return self.db.get_status(visitor_id)
    
    def get_queue_stats(self):
        """Retorna estatísticas completas"""
        with automation_lock:
            active_count = len(self.active_automations)
            active_list = list(self.active_automations.keys())
        
        queue_size = automation_queue.qsize()
        db_stats = self.db.get_stats()
        
        return {
            'queue_size': queue_size,
            'active_automations': active_count,
            'active_list': active_list,
            'max_workers': self.max_workers,
            'database_stats': db_stats,
            'server_uptime': datetime.now().isoformat()
        }

# Decorador para autenticação
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'API key requerida'}), 401
        
        api_key = auth_header.split(' ')[1]
        if api_key != API_KEY:
            return jsonify({'error': 'API key inválida'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

# Inicializar gerenciador
queue_manager = AutomationQueueManager(max_workers=MAX_WORKERS)

# ========== ROTAS API ==========

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificação de saúde do servidor"""
    stats = queue_manager.get_queue_stats()
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0',
        'queue_stats': stats
    })

@app.route('/api/hikcentral/automation', methods=['POST'])
@require_api_key
def start_automation():
    """Inicia nova automação de cadastro com suporte a foto"""
    try:
        data = request.get_json()
        
        if not data or 'visitor_id' not in data or 'visitor_data' not in data:
            return jsonify({
                'success': False,
                'error': 'visitor_id e visitor_data são obrigatórios'
            }), 400
        
        visitor_id = data['visitor_id']
        visitor_data = data['visitor_data']
        
        # Validar dados obrigatórios
        required_fields = ['name']
        for field in required_fields:
            if field not in visitor_data or not visitor_data[field]:
                return jsonify({
                    'success': False,
                    'error': f'Campo obrigatório ausente ou vazio: {field}'
                }), 400
        
        # Processar foto se presente
        photo_saved = False
        if 'photo_base64' in visitor_data and visitor_data['photo_base64']:
            try:
                photo_result = save_visitor_photo(
                    visitor_id, 
                    visitor_data['photo_base64'],
                    {
                        'name': visitor_data.get('name'),
                        'timestamp': datetime.now().isoformat()
                    }
                )
                
                if photo_result['success']:
                    photo_saved = True
                    # Salvar registro no banco
                    queue_manager.db.save_visitor_photo_record(
                        visitor_id,
                        photo_result['photo_info']['filepath'],
                        photo_result['photo_info']['file_size'],
                        photo_result['photo_info']['metadata']
                    )
                    logging.info(f"📸 Foto salva para visitante {visitor_id}")
                else:
                    logging.warning(f"⚠️ Falha ao salvar foto para {visitor_id}: {photo_result.get('error')}")
                    
            except Exception as e:
                logging.error(f"❌ Erro ao processar foto para {visitor_id}: {e}")
        
        # Adicionar à fila
        queue_manager.add_to_queue(visitor_id, visitor_data)
        
        return jsonify({
            'success': True,
            'message': f'Automação iniciada para visitante {visitor_id}',
            'visitor_id': visitor_id,
            'status': 'queued',
            'photo_received': photo_saved,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"❌ Erro ao iniciar automação: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/hikcentral/status/<visitor_id>', methods=['GET'])
@require_api_key
def get_automation_status(visitor_id):
    """Obtém status de uma automação específica"""
    try:
        status = queue_manager.get_status(visitor_id)
        
        if status:
            return jsonify({
                'success': True,
                'visitor_id': visitor_id,
                'status': status,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Automação não encontrada',
                'visitor_id': visitor_id
            }), 404
            
    except Exception as e:
        logging.error(f"❌ Erro ao obter status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/hikcentral/stats', methods=['GET'])
@require_api_key
def get_stats():
    """Retorna estatísticas completas do sistema"""
    try:
        stats = queue_manager.get_queue_stats()
        
        return jsonify({
            'success': True,
            'stats': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"❌ Erro ao obter estatísticas: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/hikcentral/queue', methods=['GET'])
@require_api_key
def get_queue_info():
    """Retorna informações da fila"""
    try:
        stats = queue_manager.get_queue_stats()
        
        return jsonify({
            'success': True,
            'queue_info': {
                'pending_in_queue': stats['queue_size'],
                'currently_processing': stats['active_automations'],
                'active_workers': stats['max_workers'],
                'processing_list': stats['active_list']
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ========== NOVAS ROTAS API PARA FOTOS ==========

@app.route('/api/hikcentral/photo/<visitor_id>', methods=['POST'])
@require_api_key
def upload_visitor_photo(visitor_id):
    """Upload de foto para um visitante específico"""
    try:
        data = request.get_json()
        
        if not data or 'photo_base64' not in data:
            return jsonify({
                'success': False,
                'error': 'photo_base64 é obrigatório'
            }), 400
        
        # Salvar foto
        result = save_visitor_photo(
            visitor_id,
            data['photo_base64'],
            data.get('metadata', {})
        )
        
        if result['success']:
            # Salvar registro no banco
            queue_manager.db.save_visitor_photo_record(
                visitor_id,
                result['photo_info']['filepath'],
                result['photo_info']['file_size'],
                result['photo_info']['metadata']
            )
            
            return jsonify({
                'success': True,
                'message': 'Foto salva com sucesso',
                'photo_info': {
                    'filename': result['photo_info']['filename'],
                    'file_size': result['photo_info']['file_size'],
                    'timestamp': result['photo_info']['timestamp']
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Erro ao salvar foto')
            }), 500
            
    except Exception as e:
        logging.error(f"❌ Erro ao fazer upload da foto: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/hikcentral/photo/<visitor_id>', methods=['GET'])
@require_api_key
def get_visitor_photo(visitor_id):
    """Recupera foto de um visitante"""
    try:
        result = queue_manager.photo_manager.get_photo_base64(visitor_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'photo_base64': result['photo_base64'],
                'filename': result['filename'],
                'file_size': result['file_size'],
                'metadata': result.get('metadata', {})
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 404
            
    except Exception as e:
        logging.error(f"❌ Erro ao recuperar foto: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/hikcentral/photos/<visitor_id>', methods=['GET'])
@require_api_key
def list_visitor_photos(visitor_id):
    """Lista todas as fotos de um visitante"""
    try:
        photos = queue_manager.photo_manager.get_visitor_photos(visitor_id)
        
        return jsonify({
            'success': True,
            'visitor_id': visitor_id,
            'photos': photos,
            'count': len(photos)
        })
        
    except Exception as e:
        logging.error(f"❌ Erro ao listar fotos: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/hikcentral/photos/<visitor_id>', methods=['DELETE'])
@require_api_key
def delete_visitor_photos(visitor_id):
    """Remove todas as fotos de um visitante"""
    try:
        result = queue_manager.photo_manager.delete_visitor_photos(visitor_id)
        
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"❌ Erro ao remover fotos: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Criar diretório de logs
    os.makedirs('logs', exist_ok=True)
    
    logging.info("🚀 Iniciando servidor de automação HikCentral em modo produção")
    logging.info(f"📊 Configuração: {MAX_WORKERS} workers, {RETRY_ATTEMPTS} tentativas máximas")
    
    try:
        app.run(
            host='0.0.0.0',
            port=5001,
            debug=False,
            threaded=True
        )
    except KeyboardInterrupt:
        logging.info("🛑 Servidor interrompido pelo usuário")
        queue_manager.running = False
    except Exception as e:
        logging.error(f"❌ Erro crítico no servidor: {e}")
    finally:
        logging.info("🔒 Servidor finalizado") 
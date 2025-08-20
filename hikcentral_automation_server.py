#!/usr/bin/env python3
"""
Servidor Flask para automação do HikCentral
Executar na máquina da portaria para receber requisições do sistema principal
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
import threading
import time
from datetime import datetime
import logging
from hikcentral_automation import HikCentralAutomation

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('hikcentral_automation.log'),
        logging.StreamHandler()
    ]
)

app = Flask(__name__)
CORS(app)

# Configurações
API_KEY = os.getenv('HIKCENTRAL_AUTOMATION_API_KEY', 'default-key')
PORT = int(os.getenv('HIKCENTRAL_AUTOMATION_PORT', 5000))

# Armazenar status das automações em andamento
automation_status = {}
automation_lock = threading.Lock()

class AutomationManager:
    def __init__(self):
        self.automation = None
        self.current_visitor_id = None
        self.is_running = False
        
    def start_automation(self, visitor_id, visitor_data):
        """Inicia uma nova automação"""
        if self.is_running:
            return False, "Já existe uma automação em andamento"
        
        try:
            self.current_visitor_id = visitor_id
            self.is_running = True
            
            # Atualizar status
            with automation_lock:
                automation_status[visitor_id] = {
                    'status': 'running',
                    'started_at': datetime.now().isoformat(),
                    'step': 'initializing',
                    'message': 'Iniciando automação...'
                }
            
            # Executar automação em thread separada
            thread = threading.Thread(
                target=self._run_automation,
                args=(visitor_id, visitor_data)
            )
            thread.daemon = True
            thread.start()
            
            return True, "Automação iniciada com sucesso"
            
        except Exception as e:
            self.is_running = False
            self.current_visitor_id = None
            logging.error(f"Erro ao iniciar automação: {e}")
            return False, str(e)
    
    def _run_automation(self, visitor_id, visitor_data):
        """Executa a automação em background"""
        try:
            logging.info(f"🚀 Iniciando automação para visitante {visitor_id}")
            
            # Atualizar status
            with automation_lock:
                automation_status[visitor_id]['step'] = 'setup_driver'
                automation_status[visitor_id]['message'] = 'Configurando navegador...'
            
            # Criar instância da automação
            self.automation = HikCentralAutomation()
            
            # Atualizar status
            with automation_lock:
                automation_status[visitor_id]['step'] = 'setup_driver'
                automation_status[visitor_id]['message'] = 'Configurando Chrome...'
            
            # Configurar driver
            self.automation.setup_driver()
            
            # Atualizar status
            with automation_lock:
                automation_status[visitor_id]['step'] = 'executing'
                automation_status[visitor_id]['message'] = 'Executando automação...'
            
            # Executar automação
            result = self.automation.register_visitor(visitor_data)
            
            # Atualizar status final
            with automation_lock:
                if result['success']:
                    automation_status[visitor_id] = {
                        'status': 'completed',
                        'started_at': automation_status[visitor_id]['started_at'],
                        'completed_at': datetime.now().isoformat(),
                        'step': 'completed',
                        'message': 'Automação concluída com sucesso',
                        'result': result
                    }
                    logging.info(f"✅ Automação concluída com sucesso para visitante {visitor_id}")
                else:
                    automation_status[visitor_id] = {
                        'status': 'failed',
                        'started_at': automation_status[visitor_id]['started_at'],
                        'completed_at': datetime.now().isoformat(),
                        'step': 'failed',
                        'message': f"Falha na automação: {result.get('error', 'Erro desconhecido')}",
                        'result': result
                    }
                    logging.error(f"❌ Falha na automação para visitante {visitor_id}: {result.get('error')}")
            
        except Exception as e:
            logging.error(f"❌ Erro durante automação para visitante {visitor_id}: {e}")
            
            # Atualizar status de erro
            with automation_lock:
                automation_status[visitor_id] = {
                    'status': 'failed',
                    'started_at': automation_status[visitor_id]['started_at'],
                    'completed_at': datetime.now().isoformat(),
                    'step': 'error',
                    'message': f"Erro durante automação: {str(e)}",
                    'result': {'success': False, 'error': str(e)}
                }
        
        finally:
            # Limpar estado
            self.is_running = False
            self.current_visitor_id = None
            
            # Fechar driver se existir
            if self.automation and self.automation.driver:
                try:
                    self.automation.close()
                except:
                    pass
                self.automation = None
    
    def cancel_automation(self, visitor_id):
        """Cancela uma automação em andamento"""
        if not self.is_running or self.current_visitor_id != visitor_id:
            return False, "Nenhuma automação em andamento para este visitante"
        
        try:
            # Fechar driver
            if self.automation and self.automation.driver:
                self.automation.close()
                self.automation = None
            
            # Atualizar status
            with automation_lock:
                if visitor_id in automation_status:
                    automation_status[visitor_id]['status'] = 'cancelled'
                    automation_status[visitor_id]['completed_at'] = datetime.now().isoformat()
                    automation_status[visitor_id]['message'] = 'Automação cancelada pelo usuário'
            
            self.is_running = False
            self.current_visitor_id = None
            
            logging.info(f"❌ Automação cancelada para visitante {visitor_id}")
            return True, "Automação cancelada com sucesso"
            
        except Exception as e:
            logging.error(f"Erro ao cancelar automação: {e}")
            return False, str(e)
    
    def get_status(self, visitor_id):
        """Retorna o status de uma automação"""
        with automation_lock:
            return automation_status.get(visitor_id, None)

# Instância global do gerenciador
automation_manager = AutomationManager()

def require_api_key(f):
    """Decorator para verificar API key"""
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'API key não fornecida'}), 401
        
        api_key = auth_header.split(' ')[1]
        if api_key != API_KEY:
            return jsonify({'error': 'API key inválida'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica a saúde da API"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'automation_running': automation_manager.is_running,
        'current_visitor': automation_manager.current_visitor_id
    })

@app.route('/api/hikcentral/automation', methods=['POST'])
@require_api_key
def start_automation():
    """Inicia uma nova automação"""
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
        required_fields = ['name', 'cpf', 'phone']
        for field in required_fields:
            if field not in visitor_data:
                return jsonify({
                    'success': False,
                    'error': f'Campo obrigatório ausente: {field}'
                }), 400
        
        logging.info(f"🚀 Recebida solicitação de automação para visitante {visitor_id}")
        
        # Iniciar automação
        success, message = automation_manager.start_automation(visitor_id, visitor_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'visitor_id': visitor_id,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': message,
                'visitor_id': visitor_id,
                'timestamp': datetime.now().isoformat()
            }), 400
            
    except Exception as e:
        logging.error(f"Erro ao iniciar automação: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/hikcentral/status/<visitor_id>', methods=['GET'])
@require_api_key
def get_automation_status(visitor_id):
    """Retorna o status de uma automação"""
    try:
        status = automation_manager.get_status(visitor_id)
        
        if not status:
            return jsonify({
                'success': False,
                'error': 'Visitante não encontrado',
                'visitor_id': visitor_id
            }), 404
        
        return jsonify({
            'success': True,
            'visitor_id': visitor_id,
            'status': status,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"Erro ao buscar status: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/hikcentral/automation/<visitor_id>', methods=['DELETE'])
@require_api_key
def cancel_automation(visitor_id):
    """Cancela uma automação em andamento"""
    try:
        success, message = automation_manager.cancel_automation(visitor_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'visitor_id': visitor_id,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': message,
                'visitor_id': visitor_id,
                'timestamp': datetime.now().isoformat()
            }), 400
            
    except Exception as e:
        logging.error(f"Erro ao cancelar automação: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/hikcentral/automations', methods=['GET'])
@require_api_key
def list_automations():
    """Lista todas as automações"""
    try:
        with automation_lock:
            return jsonify({
                'success': True,
                'automations': automation_status,
                'timestamp': datetime.now().isoformat()
            })
            
    except Exception as e:
        logging.error(f"Erro ao listar automações: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    logging.info(f"🚀 Iniciando servidor de automação HikCentral na porta {PORT}")
    logging.info(f"🔑 API Key: {API_KEY[:8]}...")
    
    try:
        app.run(
            host='0.0.0.0',
            port=PORT,
            debug=False,
            threaded=True
        )
    except KeyboardInterrupt:
        logging.info("🛑 Servidor interrompido pelo usuário")
    except Exception as e:
        logging.error(f"❌ Erro ao iniciar servidor: {e}")
        sys.exit(1) 
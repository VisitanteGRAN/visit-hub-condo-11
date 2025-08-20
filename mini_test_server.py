#!/usr/bin/env python3
"""
Servidor mínimo para teste da automação HikCentral
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import threading
import time
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)

# Configurações
API_KEY = "test-key-123"
PORT = 5001

# Armazenar status das automações
automation_status = {}
automation_lock = threading.Lock()

class MiniAutomationManager:
    def __init__(self):
        self.is_running = False
        
    def start_automation(self, visitor_id, visitor_data):
        """Simula o início de uma automação"""
        if self.is_running:
            return False, "Já existe uma automação em andamento"
        
        self.is_running = True
        
        # Atualizar status
        with automation_lock:
            automation_status[visitor_id] = {
                'status': 'running',
                'started_at': datetime.now().isoformat(),
                'step': 'initializing',
                'message': 'Iniciando automação...'
            }
        
        # Simular automação em thread separada
        thread = threading.Thread(
            target=self._simulate_automation,
            args=(visitor_id, visitor_data)
        )
        thread.daemon = True
        thread.start()
        
        return True, "Automação iniciada com sucesso"
    
    def _simulate_automation(self, visitor_id, visitor_data):
        """Simula a execução da automação"""
        try:
            logging.info(f"🚀 Simulando automação para visitante {visitor_id}")
            
            # Simular etapas
            steps = [
                ('setup_driver', 'Configurando Chrome...', 2),
                ('login', 'Fazendo login no HikCentral...', 3),
                ('navigation', 'Navegando para formulário...', 2),
                ('filling_form', 'Preenchendo formulário...', 4)
            ]
            
            for step, message, delay in steps:
                with automation_lock:
                    automation_status[visitor_id]['step'] = step
                    automation_status[visitor_id]['message'] = message
                time.sleep(delay)
            
            # Simular resultado (80% de sucesso)
            import random
            success = random.random() > 0.2
            
            with automation_lock:
                if success:
                    automation_status[visitor_id] = {
                        'status': 'completed',
                        'started_at': automation_status[visitor_id]['started_at'],
                        'completed_at': datetime.now().isoformat(),
                        'step': 'completed',
                        'message': 'Automação concluída com sucesso',
                        'result': {
                            'success': True,
                            'message': f'Visitante {visitor_data["name"]} cadastrado com sucesso',
                            'hikcentral_id': f'HK{visitor_id[-6:]}',
                            'timestamp': datetime.now().isoformat()
                        }
                    }
                else:
                    automation_status[visitor_id] = {
                        'status': 'failed',
                        'started_at': automation_status[visitor_id]['started_at'],
                        'completed_at': datetime.now().isoformat(),
                        'step': 'failed',
                        'message': 'Falha na automação: Elemento não encontrado',
                        'result': {
                            'success': False,
                            'error': 'Elemento não encontrado no formulário',
                            'step': 'form_filling',
                            'timestamp': datetime.now().isoformat()
                        }
                    }
            
        except Exception as e:
            logging.error(f"❌ Erro durante automação simulada: {e}")
            with automation_lock:
                automation_status[visitor_id] = {
                    'status': 'failed',
                    'started_at': automation_status[visitor_id]['started_at'],
                    'completed_at': datetime.now().isoformat(),
                    'step': 'error',
                    'message': f'Erro durante automação: {str(e)}',
                    'result': {'success': False, 'error': str(e)}
                }
        
        finally:
            self.is_running = False
    
    def get_status(self, visitor_id):
        """Retorna o status de uma automação"""
        with automation_lock:
            return automation_status.get(visitor_id, None)

# Instância global
manager = MiniAutomationManager()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica a saúde da API"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'automation_running': manager.is_running,
        'message': 'Servidor de teste funcionando!'
    })

@app.route('/api/hikcentral/automation', methods=['POST'])
def start_automation():
    """Inicia uma nova automação"""
    try:
        # Verificar API key
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'API key não fornecida'}), 401
        
        api_key = auth_header.split(' ')[1]
        if api_key != API_KEY:
            return jsonify({'error': 'API key inválida'}), 401
        
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
        success, message = manager.start_automation(visitor_id, visitor_data)
        
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
def get_automation_status(visitor_id):
    """Retorna o status de uma automação"""
    try:
        # Verificar API key
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'API key não fornecida'}), 401
        
        api_key = auth_header.split(' ')[1]
        if api_key != API_KEY:
            return jsonify({'error': 'API key inválida'}), 401
        
        status = manager.get_status(visitor_id)
        
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

if __name__ == '__main__':
    logging.info(f"🚀 Iniciando servidor de teste na porta {PORT}")
    logging.info(f"🔑 API Key: {API_KEY}")
    logging.info("📝 Este é um servidor de SIMULAÇÃO!")
    
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
        import sys
        sys.exit(1) 
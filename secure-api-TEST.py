#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# API PARA TESTE - SEMPRE RETORNA VISITANTE PENDENTE

import json
import time
from datetime import datetime
from collections import defaultdict
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api_test.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class TestAPIHandler(BaseHTTPRequestHandler):
    """API Handler para testes - SEMPRE retorna visitante pendente"""
    
    # Tokens válidos (carregados do arquivo)
    VALID_TOKENS = {}
    
    # Rate limiting
    RATE_LIMITS = defaultdict(list)
    
    @classmethod
    def load_tokens(cls):
        """Carregar tokens do arquivo JSON"""
        try:
            with open('api_tokens_CONFIDENTIAL.json', 'r') as f:
                data = json.load(f)
            
            cls.VALID_TOKENS = {}
            for name, token_data in data.items():
                cls.VALID_TOKENS[token_data['token']] = {
                    'name': name,
                    'permissions': token_data['permissions'],
                    'rate_limit': token_data['rate_limit']
                }
            
            logger.info(f"[OK] {len(cls.VALID_TOKENS)} tokens carregados")
            
        except FileNotFoundError:
            logger.error("[ERRO] Arquivo api_tokens_CONFIDENTIAL.json não encontrado!")
            exit(1)
    
    def validate_token(self, token):
        """Valida token e retorna dados"""
        return self.VALID_TOKENS.get(token)
    
    def parse_query_params(self):
        """Parse query parameters from URL"""
        parsed_url = urlparse(self.path)
        return parse_qs(parsed_url.query)
    
    def authenticate_request(self):
        """Autentica requisição via token Bearer"""
        auth_header = self.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            self.send_json_response(401, {'error': 'Token obrigatório'})
            return False
        
        token = auth_header[7:]  # Remove 'Bearer '
        self.token_data = self.validate_token(token)
        
        if not self.token_data:
            logger.info(f"SECURITY: Token inválido de {self.client_address[0]}: {token[:12]}...")
            self.send_json_response(401, {'error': 'Token inválido'})
            return False
        
        logger.info(f"SECURITY: AUTH_SUCCESS - {self.token_data['name']} de {self.client_address[0]}")
        return True
    
    def send_json_response(self, code, data):
        """Envia resposta JSON"""
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        response = json.dumps(data, ensure_ascii=False, indent=2)
        self.wfile.write(response.encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Health check sem autenticação
        if path == '/health':
            self.send_json_response(200, {
                'status': 'OK',
                'message': 'API de teste funcionando!',
                'timestamp': datetime.now().isoformat()
            })
            return
        
        # Demais endpoints requerem autenticação
        if not self.authenticate_request():
            return
        
        if path.startswith('/api/visitante'):
            # ⭐ ENDPOINT DE TESTE - SEMPRE RETORNA VISITANTE PENDENTE ⭐
            query_params = self.parse_query_params()
            status = query_params.get('status', ['all'])[0]
            limit = int(query_params.get('limit', ['10'])[0])
            
            logger.info(f"[TEST] Requisição: status={status}, limit={limit}")
            
            if status == 'pending':
                # SEMPRE retornar um visitante de teste para garantir que o polling funcione
                test_visitor = {
                    'id': f'test_{int(time.time())}',
                    'status': 'pending',
                    'visitor_data': {
                        'nome': 'João Silva Teste',
                        'telefone': '11999999999',
                        'cpf': '12345678901',
                        'rg': '12345678',
                        'placa': 'ABC1234',
                        'genero': 'Masculino',
                        'action': 'create'
                    },
                    'created_at': datetime.now().isoformat()
                }
                
                logger.info(f"[TEST] Retornando visitante de teste: {test_visitor['id']}")
                self.send_json_response(200, [test_visitor])
            else:
                self.send_json_response(200, [])
        else:
            self.send_json_response(404, {'error': 'Endpoint não encontrado'})
    
    def do_PATCH(self):
        """Handle PATCH requests - Simular atualizações de status"""
        if not self.authenticate_request():
            return
        
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Ler dados do PATCH
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length:
            post_data = self.rfile.read(content_length)
            try:
                request_data = json.loads(post_data.decode('utf-8'))
            except:
                request_data = {}
        else:
            request_data = {}
        
        if 'status' in path:
            # Simular atualização de status
            new_status = request_data.get('status', 'unknown')
            visitor_id = path.split('/')[-2] if '/' in path else 'unknown'
            
            logger.info(f"[TEST] Atualizando visitante {visitor_id} para status: {new_status}")
            
            self.send_json_response(200, {
                'success': True,
                'message': f'Status atualizado para {new_status}',
                'visitor_id': visitor_id,
                'new_status': new_status
            })
        else:
            self.send_json_response(404, {'error': 'Endpoint não encontrado'})

def main():
    # Carregar tokens
    TestAPIHandler.load_tokens()
    
    # Configurar servidor
    server_address = ('0.0.0.0', 5001)
    httpd = HTTPServer(server_address, TestAPIHandler)
    
    print("[TEST] API DE TESTE INICIADA")
    print("=" * 50)
    print(f"[SERVER] Servidor: http://localhost:5001")
    print(f"[HEALTH] Health check: http://localhost:5001/health")
    print(f"[TOKENS] Tokens carregados: {len(TestAPIHandler.VALID_TOKENS)}")
    print(f"[LOGS] Logs: api_test.log")
    print()
    print("[IMPORTANTE] ESTA API SEMPRE RETORNA UM VISITANTE PENDENTE PARA TESTE!")
    print()
    print("[INFO] Pressione Ctrl+C para parar")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[STOP] Servidor parado pelo usuário")
        httpd.shutdown()

if __name__ == '__main__':
    main()

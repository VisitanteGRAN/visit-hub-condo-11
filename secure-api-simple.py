#!/usr/bin/env python3
# 🔐 API SIMPLES COM AUTENTICAÇÃO POR TOKEN
# Versão mínima para implementação imediata

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
        logging.FileHandler('api_security.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SecureAPIHandler(BaseHTTPRequestHandler):
    # Tokens válidos (carregados do arquivo)
    VALID_TOKENS = {}
    
    # Rate limiting (requests por minuto)
    request_counts = defaultdict(list)
    blocked_ips = set()
    failed_attempts = defaultdict(int)
    
    @classmethod
    def load_tokens(cls):
        """Carrega tokens do arquivo JSON"""
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
            
            logger.info(f"✅ {len(cls.VALID_TOKENS)} tokens carregados")
            
        except FileNotFoundError:
            logger.error("❌ Arquivo api_tokens_CONFIDENTIAL.json não encontrado!")
            logger.error("Execute: python3 generate-tokens.py")
            exit(1)
    
    def validate_token(self, token):
        """Valida token e retorna dados"""
        return self.VALID_TOKENS.get(token)
    
    def check_rate_limit(self, client_ip, rate_limit):
        """Verifica rate limiting"""
        now = time.time()
        
        # Limpar requests antigos (últimos 60 segundos)
        self.request_counts[client_ip] = [
            req for req in self.request_counts[client_ip] 
            if now - req < 60
        ]
        
        # Verificar limite
        if len(self.request_counts[client_ip]) >= rate_limit:
            return False
        
        # Adicionar request atual
        self.request_counts[client_ip].append(now)
        return True
    
    def log_security_event(self, event_type, details):
        """Log de segurança"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'event': event_type,
            'ip': self.client_address[0],
            'path': self.path,
            'details': details
        }
        logger.info(f"SECURITY: {json.dumps(log_entry)}")
    
    def send_json_response(self, status_code, data):
        """Envia resposta JSON"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.end_headers()
        
        response = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response.encode('utf-8'))
    
    def authenticate_request(self):
        """Autentica request usando token no header"""
        client_ip = self.client_address[0]
        
        # Verificar se IP está bloqueado
        if client_ip in self.blocked_ips:
            self.log_security_event('BLOCKED_IP_ACCESS', {'ip': client_ip})
            self.send_json_response(403, {'error': 'IP bloqueado'})
            return False
        
        # Health check sem autenticação
        if self.path == '/health':
            return True
        
        # Extrair token dos headers
        token = None
        auth_header = self.headers.get('Authorization')
        api_key_header = self.headers.get('X-API-Key')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]  # Remove 'Bearer '
        elif api_key_header:
            token = api_key_header
        
        if not token:
            self.log_security_event('MISSING_TOKEN', {'ip': client_ip})
            self.failed_attempts[client_ip] += 1
            
            # Bloquear após 5 tentativas
            if self.failed_attempts[client_ip] >= 5:
                self.blocked_ips.add(client_ip)
                self.log_security_event('IP_BLOCKED', {
                    'ip': client_ip,
                    'failed_attempts': self.failed_attempts[client_ip]
                })
            
            self.send_json_response(401, {'error': 'Token obrigatório'})
            return False
        
        # Validar token
        token_data = self.validate_token(token)
        if not token_data:
            self.log_security_event('INVALID_TOKEN', {
                'ip': client_ip,
                'token_prefix': token[:10] + '...'
            })
            self.failed_attempts[client_ip] += 1
            self.send_json_response(401, {'error': 'Token inválido'})
            return False
        
        # Rate limiting
        if not self.check_rate_limit(client_ip, token_data['rate_limit']):
            self.log_security_event('RATE_LIMIT_EXCEEDED', {
                'ip': client_ip,
                'token_name': token_data['name'],
                'rate_limit': token_data['rate_limit']
            })
            self.send_json_response(429, {'error': 'Rate limit excedido'})
            return False
        
        # Armazenar dados do token para uso posterior
        self.token_data = token_data
        
        # Reset failed attempts
        if client_ip in self.failed_attempts:
            del self.failed_attempts[client_ip]
        
        self.log_security_event('AUTH_SUCCESS', {
            'token_name': token_data['name'],
            'permissions': token_data['permissions']
        })
        
        return True
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        if not self.authenticate_request():
            return
        
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/health':
            self.send_json_response(200, {
                'status': 'OK',
                'timestamp': datetime.now().isoformat(),
                'message': 'API funcionando com autenticação segura!',
                'version': '1.0.0'
            })
            
        elif path == '/api/stats':
            # Estatísticas (apenas para admin)
            if hasattr(self, 'token_data') and '*' in self.token_data['permissions']:
                self.send_json_response(200, {
                    'total_tokens': len(self.VALID_TOKENS),
                    'active_requests': sum(len(reqs) for reqs in self.request_counts.values()),
                    'blocked_ips': len(self.blocked_ips),
                    'timestamp': datetime.now().isoformat()
                })
            else:
                self.send_json_response(403, {'error': 'Permissão negada'})
                
        elif path.startswith('/api/visitante'):
            # Endpoint de visitantes
            self.send_json_response(200, {
                'message': 'Endpoint de visitantes',
                'authenticated_as': getattr(self, 'token_data', {}).get('name', 'unknown'),
                'visitor_id': path.split('/')[-1] if len(path.split('/')) > 3 else None
            })
            
        else:
            self.send_json_response(404, {'error': 'Endpoint não encontrado'})
    
    def do_POST(self):
        """Handle POST requests"""
        if not self.authenticate_request():
            return
        
        # Ler body da requisição
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else ''
        
        try:
            request_data = json.loads(post_data) if post_data else {}
        except json.JSONDecodeError:
            self.send_json_response(400, {'error': 'JSON inválido'})
            return
        
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/visitante':
            # Criar visitante
            self.log_security_event('VISITOR_CREATE', {
                'token_name': self.token_data['name'],
                'visitor_name': request_data.get('nome', 'N/A')
            })
            
            self.send_json_response(200, {
                'success': True,
                'message': 'Visitante criado com sucesso',
                'visitor_id': f"visitor_{int(time.time())}",
                'authenticated_as': self.token_data['name']
            })
            
        elif path == '/api/visitante/reactivate':
            # Reativar visitante
            self.log_security_event('VISITOR_REACTIVATE', {
                'token_name': self.token_data['name'],
                'cpf_hash': request_data.get('cpf', '')[:5] + '...'
            })
            
            self.send_json_response(200, {
                'success': True,
                'message': 'Visitante reativado',
                'authenticated_as': self.token_data['name']
            })
            
        else:
            self.send_json_response(404, {'error': 'Endpoint não encontrado'})
    
    def log_message(self, format, *args):
        """Override para usar nosso logger"""
        logger.info(f"{self.client_address[0]} - {format % args}")

def main():
    # Carregar tokens
    SecureAPIHandler.load_tokens()
    
    # Configurar servidor
    server_address = ('0.0.0.0', 5001)
    httpd = HTTPServer(server_address, SecureAPIHandler)
    
    print("🔐 API SEGURA INICIADA")
    print("=" * 50)
    print(f"🌐 Servidor: http://localhost:5001")
    print(f"📊 Health check: http://localhost:5001/health")
    print(f"📋 Tokens carregados: {len(SecureAPIHandler.VALID_TOKENS)}")
    print(f"📝 Logs: api_security.log")
    print()
    print("🧪 TESTE:")
    print("# Sem token (deve falhar):")
    print("curl http://localhost:5001/api/visitante")
    print()
    print("# Com token (deve funcionar):")
    print("curl -H 'Authorization: Bearer frontend_...' http://localhost:5001/api/visitante")
    print()
    print("🚀 Pressione Ctrl+C para parar")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado pelo usuário")
        httpd.shutdown()

if __name__ == '__main__':
    main()

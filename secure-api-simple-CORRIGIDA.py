#!/usr/bin/env python3
# API SIMPLES COM AUTENTICAÇÃO POR TOKEN - VERSÃO CORRIGIDA
# ✅ Consulta Supabase real
# ✅ Sem emojis para Windows
# ✅ Configurações via .env

import json
import time
import os
from datetime import datetime
from collections import defaultdict
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import logging
import requests

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
    
    # Configurações do Supabase (carregadas do .env)
    SUPABASE_URL = None
    SUPABASE_SERVICE_KEY = None
    
    @classmethod
    def load_env_config(cls):
        """Carrega configurações do arquivo .env"""
        try:
            with open('.env', 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        if key == 'SUPABASE_URL':
                            cls.SUPABASE_URL = value
                        elif key == 'SUPABASE_SERVICE_KEY':
                            cls.SUPABASE_SERVICE_KEY = value
            
            if cls.SUPABASE_URL and cls.SUPABASE_SERVICE_KEY:
                logger.info("[OK] Configurações do Supabase carregadas com sucesso")
            else:
                logger.warning("[AVISO] Configurações do Supabase não encontradas no .env")
                
        except FileNotFoundError:
            logger.error("[ERRO] Arquivo .env não encontrado")
        except Exception as e:
            logger.error(f"[ERRO] Erro ao carregar .env: {e}")

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
            
            logger.info(f"[OK] {len(cls.VALID_TOKENS)} tokens carregados")
            
        except FileNotFoundError:
            logger.error("[ERRO] Arquivo api_tokens_CONFIDENTIAL.json não encontrado!")
            logger.error("Execute: python generate-tokens.py")
            exit(1)

    def get_supabase_queue(self):
        """Consulta a fila de visitantes no Supabase"""
        if not self.SUPABASE_URL or not self.SUPABASE_SERVICE_KEY:
            logger.error("[ERRO] Configurações do Supabase não carregadas")
            return {'queue': [], 'total': 0, 'error': 'Configuração inválida'}
        
        try:
            headers = {
                'apikey': self.SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {self.SUPABASE_SERVICE_KEY}',
                'Content-Type': 'application/json'
            }
            
            # Consultar visitantes pendentes
            url = f"{self.SUPABASE_URL}/rest/v1/visitor_registration_queue"
            params = {
                'status': 'eq.pending',
                'select': '*'
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                visitors = response.json()
                logger.info(f"[SUPABASE] {len(visitors)} visitantes pendentes encontrados")
                return {
                    'queue': visitors,
                    'total': len(visitors),
                    'status': 'success'
                }
            else:
                logger.error(f"[ERRO] Supabase: {response.status_code} - {response.text}")
                return {
                    'queue': [],
                    'total': 0, 
                    'error': f'Erro HTTP {response.status_code}',
                    'details': response.text
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"[ERRO] Conexão com Supabase: {e}")
            return {
                'queue': [],
                'total': 0,
                'error': 'Erro de conexão',
                'details': str(e)
            }
    
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
        
        # Adicionar este request
        self.request_counts[client_ip].append(now)
        return True
    
    def authenticate_request(self):
        """Autenticar requisição usando token"""
        client_ip = self.client_address[0]
        
        # Verificar se IP está bloqueado
        if client_ip in self.blocked_ips:
            self.send_json_response(429, {'error': 'IP bloqueado por tentativas excessivas'})
            return False
        
        # Extrair token do header
        auth_header = self.headers.get('Authorization', '')
        api_key_header = self.headers.get('X-API-Key', '')
        
        token = None
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
        elif api_key_header:
            token = api_key_header
        
        if not token:
            self.failed_attempts[client_ip] += 1
            if self.failed_attempts[client_ip] >= 5:
                self.blocked_ips.add(client_ip)
                logger.warning(f"[BLOQUEIO] IP {client_ip} bloqueado por tentativas excessivas")
            
            self.send_json_response(401, {'error': 'Token de autenticação obrigatório'})
            return False
        
        # Validar token
        token_data = self.validate_token(token)
        if not token_data:
            self.failed_attempts[client_ip] += 1
            if self.failed_attempts[client_ip] >= 5:
                self.blocked_ips.add(client_ip)
                logger.warning(f"[BLOQUEIO] IP {client_ip} bloqueado por tentativas excessivas")
            
            self.send_json_response(401, {'error': 'Token inválido'})
            return False
        
        # Verificar rate limiting
        if not self.check_rate_limit(client_ip, token_data['rate_limit']):
            self.send_json_response(429, {'error': 'Rate limit excedido'})
            return False
        
        # Reset failed attempts para este IP
        self.failed_attempts[client_ip] = 0
        
        # Armazenar dados do token para uso posterior
        self.token_data = token_data
        
        # Log de sucesso
        self.log_security_event('AUTH_SUCCESS', {
            'token_name': token_data['name'],
            'permissions': token_data['permissions']
        })
        
        return True
    
    def send_json_response(self, status_code, data):
        """Enviar resposta JSON"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = json.dumps(data, ensure_ascii=False, indent=2)
        self.wfile.write(response.encode('utf-8'))
    
    def log_security_event(self, event_type, details):
        """Log de evento de segurança"""
        security_log = {
            'timestamp': datetime.now().isoformat(),
            'event': event_type,
            'ip': self.client_address[0],
            'path': getattr(self, 'path', 'unknown'),
            'details': details
        }
        
        logger.info(f"SECURITY: {json.dumps(security_log)}")
        
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
                
        elif path == '/api/queue':
            # Endpoint da fila de visitantes
            self.log_security_event('QUEUE_CHECK', {
                'token_name': self.token_data['name']
            })
            
            # Consultar fila real no Supabase
            queue_data = self.get_supabase_queue()
            
            response = {
                'authenticated_as': self.token_data['name'],
                'timestamp': datetime.now().isoformat(),
                **queue_data
            }
            
            self.send_json_response(200, response)
            
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
            # Processar dados do visitante
            self.send_json_response(200, {
                'message': 'Dados recebidos com sucesso',
                'data': request_data,
                'authenticated_as': getattr(self, 'token_data', {}).get('name', 'unknown'),
                'timestamp': datetime.now().isoformat()
            })
        else:
            self.send_json_response(404, {'error': 'Endpoint não encontrado'})
    
    def log_message(self, format, *args):
        """Override para usar nosso logger"""
        logger.info(f"{self.client_address[0]} - {format % args}")

def main():
    # Carregar configurações do .env
    SecureAPIHandler.load_env_config()
    
    # Carregar tokens
    SecureAPIHandler.load_tokens()
    
    # Configurar servidor
    server_address = ('0.0.0.0', 5001)
    httpd = HTTPServer(server_address, SecureAPIHandler)
    
    print("[API] API SEGURA INICIADA")
    print("=" * 50)
    print(f"Servidor: http://localhost:5001")
    print(f"Health check: http://localhost:5001/health")
    print(f"Tokens carregados: {len(SecureAPIHandler.VALID_TOKENS)}")
    print(f"Logs: api_security.log")
    print(f"Supabase: {'Configurado' if SecureAPIHandler.SUPABASE_URL else 'Nao configurado'}")
    print()
    print("TESTE:")
    print("# Sem token (deve falhar):")
    print("curl http://localhost:5001/api/visitante")
    print()
    print("# Com token (deve funcionar):")
    print("curl -H 'Authorization: Bearer frontend_...' http://localhost:5001/api/visitante")
    print()
    print("Pressione Ctrl+C para parar")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[PARADO] Servidor parado pelo usuario")
        httpd.shutdown()

if __name__ == '__main__':
    main()

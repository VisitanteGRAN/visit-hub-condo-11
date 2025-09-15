#!/usr/bin/env python3
# 🔐 SISTEMA DE AUTENTICAÇÃO POR TOKEN - API SEGURA
# Implementa token no cabeçalho + rate limiting + logs de segurança

import secrets
import time
import json
import logging
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict
from flask import Flask, request, jsonify, g
import jwt

class SecureAPIAuth:
    def __init__(self, app=None):
        self.app = app
        self.api_tokens = {}
        self.request_counts = defaultdict(list)
        self.blocked_ips = set()
        self.failed_attempts = defaultdict(int)
        
        # Configurar logging de segurança
        self.setup_security_logging()
        
        # Gerar tokens iniciais
        self.setup_initial_tokens()
        
        if app:
            self.init_app(app)
    
    def setup_security_logging(self):
        """Configura logging de segurança detalhado"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('security_api.log'),
                logging.StreamHandler()
            ]
        )
        self.security_logger = logging.getLogger('security_api')
    
    def setup_initial_tokens(self):
        """Gera tokens seguros iniciais"""
        # Token para o frontend (PWA)
        frontend_token = self.generate_secure_token('frontend')
        
        # Token para administração
        admin_token = self.generate_secure_token('admin')
        
        # Token para sistema interno
        system_token = self.generate_secure_token('system')
        
        self.api_tokens = {
            frontend_token: {
                'name': 'frontend_pwa',
                'permissions': ['visitor:create', 'visitor:read', 'queue:read'],
                'rate_limit': 60,  # 60 req/min
                'created_at': datetime.now(),
                'last_used': None,
                'usage_count': 0
            },
            admin_token: {
                'name': 'admin_panel', 
                'permissions': ['*'],  # Todas as permissões
                'rate_limit': 120,  # 120 req/min
                'created_at': datetime.now(),
                'last_used': None,
                'usage_count': 0
            },
            system_token: {
                'name': 'internal_system',
                'permissions': ['visitor:*', 'hikcentral:*'],
                'rate_limit': 300,  # 300 req/min
                'created_at': datetime.now(),
                'last_used': None,
                'usage_count': 0
            }
        }
        
        # Salvar tokens em arquivo seguro (apenas uma vez)
        self.save_tokens_securely()
    
    def generate_secure_token(self, prefix='api'):
        """Gera token criptograficamente seguro"""
        # 32 bytes = 256 bits de entropia
        random_bytes = secrets.token_bytes(32)
        
        # Adicionar timestamp e prefix para unicidade
        timestamp = str(int(time.time()))
        data = f"{prefix}_{timestamp}_{random_bytes.hex()}"
        
        # Hash SHA-256 para token final
        token = hashlib.sha256(data.encode()).hexdigest()
        
        return f"{prefix}_{token[:32]}"  # Prefixo + 32 chars
    
    def save_tokens_securely(self):
        """Salva tokens em arquivo para referência"""
        token_info = {}
        for token, data in self.api_tokens.items():
            token_info[data['name']] = {
                'token': token,
                'permissions': data['permissions'],
                'rate_limit': data['rate_limit']
            }
        
        with open('api_tokens_CONFIDENTIAL.json', 'w') as f:
            json.dump(token_info, f, indent=2, default=str)
        
        print("🔐 TOKENS GERADOS - GUARDE COM SEGURANÇA:")
        print("=" * 60)
        for name, info in token_info.items():
            print(f"📋 {name.upper()}:")
            print(f"   Token: {info['token']}")
            print(f"   Rate Limit: {info['rate_limit']} req/min")
            print(f"   Permissões: {info['permissions']}")
            print()
    
    def init_app(self, app):
        """Inicializa middlewares de segurança no Flask"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def validate_token(self, token):
        """Valida token e retorna informações"""
        if not token:
            return None
            
        token_data = self.api_tokens.get(token)
        if not token_data:
            return None
        
        # Atualizar estatísticas de uso
        token_data['last_used'] = datetime.now()
        token_data['usage_count'] += 1
        
        return token_data
    
    def check_permissions(self, token_data, required_permission):
        """Verifica se token tem permissão necessária"""
        permissions = token_data.get('permissions', [])
        
        # Permissão total
        if '*' in permissions:
            return True
        
        # Permissão específica
        if required_permission in permissions:
            return True
        
        # Permissão com wildcard (ex: visitor:*)
        for perm in permissions:
            if perm.endswith(':*'):
                prefix = perm[:-1]  # Remove '*'
                if required_permission.startswith(prefix):
                    return True
        
        return False
    
    def rate_limit_check(self, client_ip, token_data):
        """Verifica rate limiting por IP e token"""
        now = time.time()
        rate_limit = token_data.get('rate_limit', 60)
        
        # Limpar requests antigos (últimos 60 segundos)
        self.request_counts[client_ip] = [
            req for req in self.request_counts[client_ip] 
            if now - req < 60
        ]
        
        # Verificar limite
        if len(self.request_counts[client_ip]) >= rate_limit:
            # Log de tentativa de rate limit
            self.log_security_event('RATE_LIMIT_EXCEEDED', {
                'ip': client_ip,
                'token_name': token_data.get('name'),
                'requests_count': len(self.request_counts[client_ip]),
                'limit': rate_limit
            })
            return False
        
        # Adicionar request atual
        self.request_counts[client_ip].append(now)
        return True
    
    def log_security_event(self, event_type, details):
        """Log detalhado de eventos de segurança"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'event': event_type,
            'details': details,
            'request_id': getattr(g, 'request_id', 'unknown')
        }
        
        # Log estruturado
        self.security_logger.info(f"SECURITY_EVENT: {json.dumps(log_entry)}")
        
        # Eventos críticos também no console
        if event_type in ['INVALID_TOKEN', 'RATE_LIMIT_EXCEEDED', 'PERMISSION_DENIED']:
            print(f"🚨 {event_type}: {details}")
    
    def before_request(self):
        """Middleware executado antes de cada request"""
        # Gerar ID único para request
        g.request_id = secrets.token_hex(8)
        g.start_time = time.time()
        
        client_ip = request.remote_addr
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        # Log de request
        self.log_security_event('REQUEST_START', {
            'method': request.method,
            'path': request.path,
            'ip': client_ip,
            'user_agent': user_agent
        })
        
        # Verificar se IP está bloqueado
        if client_ip in self.blocked_ips:
            self.log_security_event('BLOCKED_IP_ACCESS', {'ip': client_ip})
            return jsonify({'error': 'IP blocked due to security violations'}), 403
        
        # Pular autenticação para health check
        if request.path == '/health':
            return
        
        # Extrair token do header
        auth_header = request.headers.get('Authorization')
        api_key_header = request.headers.get('X-API-Key')
        
        token = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]  # Remove 'Bearer '
        elif api_key_header:
            token = api_key_header
        
        if not token:
            self.log_security_event('MISSING_TOKEN', {'ip': client_ip})
            self.failed_attempts[client_ip] += 1
            
            # Bloquear IP após muitas tentativas
            if self.failed_attempts[client_ip] >= 5:
                self.blocked_ips.add(client_ip)
                self.log_security_event('IP_BLOCKED', {
                    'ip': client_ip,
                    'failed_attempts': self.failed_attempts[client_ip]
                })
            
            return jsonify({'error': 'Token de autenticação obrigatório'}), 401
        
        # Validar token
        token_data = self.validate_token(token)
        if not token_data:
            self.log_security_event('INVALID_TOKEN', {
                'ip': client_ip,
                'token_prefix': token[:10] + '...' if len(token) > 10 else token
            })
            self.failed_attempts[client_ip] += 1
            return jsonify({'error': 'Token inválido'}), 401
        
        # Rate limiting
        if not self.rate_limit_check(client_ip, token_data):
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        # Armazenar dados do token para uso nas rotas
        g.token_data = token_data
        g.client_ip = client_ip
        
        # Reset failed attempts em caso de sucesso
        if client_ip in self.failed_attempts:
            del self.failed_attempts[client_ip]
    
    def after_request(self, response):
        """Middleware executado após cada request"""
        duration = time.time() - g.get('start_time', 0)
        
        # Log de resposta
        self.log_security_event('REQUEST_END', {
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
            'token_name': g.get('token_data', {}).get('name', 'unknown')
        })
        
        # Headers de segurança
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000'
        response.headers['X-Request-ID'] = g.get('request_id', 'unknown')
        
        return response
    
    def require_permission(self, permission):
        """Decorator para verificar permissões específicas"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                token_data = g.get('token_data')
                
                if not token_data:
                    return jsonify({'error': 'Token não encontrado'}), 401
                
                if not self.check_permissions(token_data, permission):
                    self.log_security_event('PERMISSION_DENIED', {
                        'required_permission': permission,
                        'token_permissions': token_data.get('permissions', []),
                        'token_name': token_data.get('name')
                    })
                    return jsonify({'error': f'Permissão negada: {permission}'}), 403
                
                return f(*args, **kwargs)
            return decorated_function
        return decorator

# =======================================
# EXEMPLO DE USO - APLICAÇÃO FLASK
# =======================================

app = Flask(__name__)
auth = SecureAPIAuth(app)

@app.route('/health')
def health_check():
    """Health check sem autenticação"""
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.now().isoformat(),
        'message': 'API funcionando com autenticação segura!'
    })

@app.route('/api/visitante', methods=['POST'])
@auth.require_permission('visitor:create')
def create_visitor():
    """Criar visitante - requer permissão específica"""
    token_data = g.token_data
    
    auth.log_security_event('VISITOR_CREATE', {
        'token_name': token_data['name'],
        'visitor_data': {
            'nome': request.json.get('nome', 'N/A'),
            'cpf_hash': hashlib.sha256(request.json.get('cpf', '').encode()).hexdigest()[:10]
        }
    })
    
    # Seu código existente aqui
    return jsonify({
        'success': True,
        'message': 'Visitante criado com sucesso',
        'authenticated_as': token_data['name']
    })

@app.route('/api/admin/stats', methods=['GET'])
@auth.require_permission('admin:read')
def admin_stats():
    """Estatísticas - apenas para admin"""
    return jsonify({
        'total_tokens': len(auth.api_tokens),
        'active_requests': len(auth.request_counts),
        'blocked_ips': len(auth.blocked_ips)
    })

@app.route('/api/security/tokens', methods=['GET'])
@auth.require_permission('*')  # Apenas super admin
def list_tokens():
    """Listar tokens - apenas super admin"""
    tokens_info = []
    for token, data in auth.api_tokens.items():
        tokens_info.append({
            'name': data['name'],
            'token_prefix': token[:10] + '...',
            'permissions': data['permissions'],
            'rate_limit': data['rate_limit'],
            'usage_count': data['usage_count'],
            'last_used': data['last_used'].isoformat() if data['last_used'] else None
        })
    
    return jsonify({'tokens': tokens_info})

if __name__ == '__main__':
    print("🔐 Iniciando API com autenticação por token...")
    print("📋 Tokens salvos em: api_tokens_CONFIDENTIAL.json")
    print("📊 Logs de segurança em: security_api.log")
    
    app.run(host='0.0.0.0', port=5001, debug=False)

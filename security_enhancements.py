#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MELHORIAS DE SEGURANÇA PARA AUTOMATION SERVER
============================================
"""

import time
import logging
from collections import defaultdict
from functools import wraps
from flask import request, jsonify
import hashlib
import secrets
import os

# Rate Limiting
rate_limit_storage = defaultdict(list)
RATE_LIMIT_REQUESTS = 10  # 10 requests
RATE_LIMIT_WINDOW = 60    # por minuto

def rate_limit(max_requests=10, window=60):
    """Decorator para rate limiting"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr
            current_time = time.time()
            
            # Limpar requests antigos
            rate_limit_storage[client_ip] = [
                req_time for req_time in rate_limit_storage[client_ip]
                if current_time - req_time < window
            ]
            
            # Verificar limite
            if len(rate_limit_storage[client_ip]) >= max_requests:
                logging.warning(f"🚨 RATE LIMIT EXCEEDED: {client_ip}")
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'retry_after': window
                }), 429
            
            # Adicionar request atual
            rate_limit_storage[client_ip].append(current_time)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def enhanced_require_api_key(f):
    """Autenticação melhorada com logs de segurança"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        client_ip = request.remote_addr
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        if not auth_header:
            logging.warning(f"🚨 UNAUTHORIZED ACCESS: {client_ip} - {user_agent}")
            return jsonify({'error': 'Authorization required'}), 401
        
        try:
            if not auth_header.startswith('Bearer '):
                raise ValueError("Invalid auth format")
                
            api_key = auth_header.split(' ')[1]
            expected_key = os.getenv('API_KEY', 'hik_automation_2024_secure_key')
            
            if not secrets.compare_digest(api_key, expected_key):
                logging.warning(f"🚨 INVALID API KEY: {client_ip} - {user_agent}")
                return jsonify({'error': 'Invalid API key'}), 401
                
            # Log acesso autorizado
            logging.info(f"✅ AUTHORIZED ACCESS: {client_ip}")
            return f(*args, **kwargs)
            
        except Exception as e:
            logging.warning(f"🚨 AUTH ERROR: {client_ip} - {e}")
            return jsonify({'error': 'Authentication error'}), 401
            
    return decorated_function

def log_request_details():
    """Log detalhes da requisição para monitoramento"""
    client_ip = request.remote_addr
    method = request.method
    path = request.path
    user_agent = request.headers.get('User-Agent', 'Unknown')
    
    logging.info(f"📊 REQUEST: {method} {path} from {client_ip} - {user_agent}")

def validate_visitor_data(data):
    """Validação robusta dos dados do visitante"""
    required_fields = ['name', 'phone']
    
    for field in required_fields:
        if field not in data or not data[field]:
            return False, f"Campo obrigatório: {field}"
    
    # Validar nome (apenas letras, espaços e acentos)
    import re
    if not re.match(r"^[a-zA-ZÀ-ÿ\s]+$", data['name']):
        return False, "Nome contém caracteres inválidos"
    
    # Validar telefone (apenas números)
    phone = re.sub(r'[^\d]', '', data['phone'])
    if len(phone) < 10 or len(phone) > 11:
        return False, "Telefone inválido"
    
    # Validar RG se fornecido
    if 'rg' in data and data['rg']:
        rg = re.sub(r'[^\d]', '', data['rg'])
        if len(rg) < 7:
            return False, "RG inválido"
    
    return True, "OK"

# Configurações de segurança para Flask
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
}

def add_security_headers(response):
    """Adicionar headers de segurança"""
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response

# Lista de IPs bloqueados (pode ser expandida)
BLOCKED_IPS = set()

def check_blocked_ip():
    """Verificar se IP está bloqueado"""
    client_ip = request.remote_addr
    if client_ip in BLOCKED_IPS:
        logging.warning(f"🚨 BLOCKED IP ACCESS: {client_ip}")
        return jsonify({'error': 'Access denied'}), 403
    return None

# Monitoramento de tentativas de invasão
failed_attempts = defaultdict(int)
BLOCK_AFTER_ATTEMPTS = 5
BLOCK_DURATION = 3600  # 1 hora

def track_failed_attempt(ip):
    """Rastrear tentativas falhadas"""
    failed_attempts[ip] += 1
    if failed_attempts[ip] >= BLOCK_AFTER_ATTEMPTS:
        BLOCKED_IPS.add(ip)
        logging.warning(f"🚨 IP BLOCKED: {ip} after {BLOCK_AFTER_ATTEMPTS} failed attempts")

# Função para integrar no servidor principal
def setup_security_enhancements(app):
    """Configurar melhorias de segurança no Flask app"""
    
    @app.before_request
    def security_check():
        # Verificar IP bloqueado
        blocked = check_blocked_ip()
        if blocked:
            return blocked
        
        # Log da requisição
        log_request_details()
    
    @app.after_request
    def add_headers(response):
        return add_security_headers(response)
    
    return app 
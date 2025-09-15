#!/usr/bin/env python3
# 🔐 GERADOR DE TOKENS SEGUROS - SEM DEPENDÊNCIAS
# Gera tokens criptograficamente seguros para autenticação da API

import secrets
import hashlib
import time
import json
from datetime import datetime

def generate_secure_token(prefix='api'):
    """Gera token criptograficamente seguro"""
    # 32 bytes = 256 bits de entropia
    random_bytes = secrets.token_bytes(32)
    
    # Adicionar timestamp e prefix para unicidade
    timestamp = str(int(time.time()))
    data = f"{prefix}_{timestamp}_{random_bytes.hex()}"
    
    # Hash SHA-256 para token final
    token = hashlib.sha256(data.encode()).hexdigest()
    
    return f"{prefix}_{token[:32]}"  # Prefixo + 32 chars

def main():
    print("🔐 GERADOR DE TOKENS SEGUROS")
    print("=" * 60)
    
    # Gerar tokens para diferentes tipos de usuário
    tokens = {
        'frontend_pwa': {
            'token': generate_secure_token('frontend'),
            'permissions': ['visitor:create', 'visitor:read', 'queue:read'],
            'rate_limit': 60,  # 60 req/min
            'description': 'Token para o PWA frontend'
        },
        'admin_panel': {
            'token': generate_secure_token('admin'),
            'permissions': ['*'],  # Todas as permissões
            'rate_limit': 120,  # 120 req/min
            'description': 'Token para painel administrativo'
        },
        'internal_system': {
            'token': generate_secure_token('system'),
            'permissions': ['visitor:*', 'hikcentral:*'],
            'rate_limit': 300,  # 300 req/min
            'description': 'Token para sistema interno'
        }
    }
    
    # Salvar tokens em arquivo JSON
    with open('api_tokens_CONFIDENTIAL.json', 'w') as f:
        json.dump(tokens, f, indent=2, default=str)
    
    # Exibir tokens gerados
    print("🔑 TOKENS GERADOS (GUARDE COM SEGURANÇA):")
    print()
    
    for name, data in tokens.items():
        print(f"📋 {name.upper()}:")
        print(f"   Token: {data['token']}")
        print(f"   Rate Limit: {data['rate_limit']} req/min")
        print(f"   Permissões: {data['permissions']}")
        print(f"   Descrição: {data['description']}")
        print()
    
    # Gerar arquivo .env com tokens
    env_content = f"""# 🔐 TOKENS DE API GERADOS AUTOMATICAMENTE
# Data de geração: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

# Token para frontend PWA
VITE_AUTOMATION_API_KEY={tokens['frontend_pwa']['token']}

# Token para admin (use no backend/scripts)
ADMIN_API_TOKEN={tokens['admin_panel']['token']}

# Token para sistema interno  
SYSTEM_API_TOKEN={tokens['internal_system']['token']}

# URL da API de automação
VITE_AUTOMATION_SERVER_URL=http://localhost:5001

# ⚠️ IMPORTANTE:
# 1. NUNCA commite este arquivo
# 2. Use HTTPS em produção
# 3. Rotacione tokens mensalmente
# 4. Configure rate limiting no servidor
"""
    
    with open('api_tokens.env', 'w') as f:
        f.write(env_content)
    
    print("📁 ARQUIVOS CRIADOS:")
    print("   - api_tokens_CONFIDENTIAL.json (dados completos)")
    print("   - api_tokens.env (para .env.local)")
    print()
    
    # Instruções de uso
    print("🚀 PRÓXIMOS PASSOS:")
    print("1. Copie o conteúdo de api_tokens.env para seu .env.local")
    print("2. Configure o servidor Python para validar estes tokens")
    print("3. Use o token frontend_* no seu PWA")
    print("4. Use o token admin_* para operações administrativas")
    print()
    
    # Exemplos de uso
    print("💡 EXEMPLO DE USO:")
    print("# No frontend:")
    print(f"fetch('/api/visitante', {{")
    print(f"  headers: {{")
    print(f"    'Authorization': 'Bearer {tokens['frontend_pwa']['token'][:20]}...',")
    print(f"    'Content-Type': 'application/json'")
    print(f"  }}")
    print(f"}});")
    print()
    
    # Teste de segurança
    print("🧪 TESTE DE SEGURANÇA:")
    print("# Teste válido:")
    print(f"curl -H 'Authorization: Bearer {tokens['frontend_pwa']['token']}' \\")
    print("     -X GET http://localhost:5001/api/health")
    print()
    print("# Teste inválido (deve falhar):")
    print("curl -X GET http://localhost:5001/api/health")
    print()
    
    print("✅ TOKENS GERADOS COM SUCESSO!")
    print("🔐 Sistema agora está pronto para autenticação segura!")

if __name__ == '__main__':
    main()

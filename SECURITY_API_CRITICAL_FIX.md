# 🚨 CORREÇÃO CRÍTICA - API INSEGURA

## 📊 **ANÁLISE DE VULNERABILIDADE**

### **❌ SITUAÇÃO ATUAL - CRÍTICA:**
```
PWA (HTTPS) → API Windows (HTTP) → HikCentral (HTTP)
     ✅              ❌               ❌
```

### **🚨 RISCOS IDENTIFICADOS:**
1. **Mixed Content:** HTTPS→HTTP bloqueado pelos browsers
2. **API Pública:** Qualquer um pode acessar via HTTP
3. **Dados Expostos:** CPF, fotos, credenciais em texto plano
4. **Man-in-the-Middle:** Interceptação de dados
5. **Replay Attacks:** Requisições podem ser repetidas

---

## 🛠️ **SOLUÇÕES IMPLEMENTÁVEIS**

### **🚀 SOLUÇÃO 1: CLOUDFLARE TUNNEL (IMEDIATA)**

#### **⚡ Implementação (5 min):**
```bash
# 1. Instalar Cloudflare Tunnel no Windows:
npm install -g cloudflared

# 2. Autenticar:
cloudflared tunnel login

# 3. Criar túnel seguro:
cloudflared tunnel --url http://localhost:5001

# 4. Resultado:
# https://abc123.trycloudflare.com → http://localhost:5001
```

#### **✅ Benefícios:**
- ✅ **HTTPS automático** (SSL/TLS)
- ✅ **DDoS protection** do Cloudflare
- ✅ **Rate limiting** nativo
- ✅ **Logs de acesso** detalhados
- ✅ **Zero configuração** no firewall

### **🔐 SOLUÇÃO 2: API GATEWAY COM VERCEL (RECOMENDADA)**

#### **⚡ Implementação:**
```bash
# 1. Criar API proxy no Vercel:
/api/automation/[...path].ts

# 2. Fluxo seguro:
PWA (HTTPS) → Vercel API (HTTPS) → Windows (HTTP interno)
```

#### **Arquivo:** `api/automation/[...path].ts`
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 🔐 Validar API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.AUTOMATION_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 🛡️ Rate limiting
  // 🧹 Sanitizar inputs
  // 📊 Log de auditoria

  // ↗️ Proxy para Windows (interno)
  const windowsUrl = process.env.WINDOWS_AUTOMATION_URL;
  const response = await fetch(`${windowsUrl}${req.url}`, {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
  });

  return res.json(await response.json());
}
```

### **🔒 SOLUÇÃO 3: VPN + SERVIDOR CLOUD (PRODUÇÃO)**

#### **⚡ Arquitetura:**
```
PWA (HTTPS) → Cloud API (HTTPS) → VPN → Windows (HTTP interno)
```

#### **Implementação:**
1. **Servidor Cloud** (DigitalOcean/AWS)
2. **VPN WireGuard** entre Cloud ↔ Windows
3. **API Gateway** no cloud
4. **Windows interno** não exposto

---

## 🚀 **IMPLEMENTAÇÃO IMEDIATA**

### **1. 🔥 EMERGÊNCIA (AGORA - 5 min):**

```bash
# Instalar Cloudflare Tunnel:
npm install -g cloudflared

# Executar (no Windows):
cloudflared tunnel --url http://localhost:5001

# Atualizar URL no sistema:
# De: http://45.4.132.189:3389
# Para: https://abc123.trycloudflare.com
```

### **2. 🛡️ AUTENTICAÇÃO (10 min):**

Adicionar no Windows Python server:
```python
# Rate limiting e autenticação
from functools import wraps
import time

API_KEY = "automation-key-2024-super-secure"
request_counts = {}

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Rate limiting por IP
        client_ip = request.remote_addr
        now = time.time()
        
        if client_ip in request_counts:
            if now - request_counts[client_ip]['last'] < 60:  # 1 min
                if request_counts[client_ip]['count'] > 10:  # Max 10 req/min
                    return jsonify({'error': 'Rate limit exceeded'}), 429
                request_counts[client_ip]['count'] += 1
            else:
                request_counts[client_ip] = {'count': 1, 'last': now}
        else:
            request_counts[client_ip] = {'count': 1, 'last': now}
        
        # Validar API key
        api_key = request.headers.get('X-API-Key')
        if api_key != API_KEY:
            return jsonify({'error': 'Unauthorized'}), 401
            
        return f(*args, **kwargs)
    return decorated_function

# Aplicar em todas as rotas:
@app.route('/api/visitante', methods=['POST'])
@require_api_key
def create_visitor():
    # ... código existente
```

### **3. 🔐 HEADERS DE SEGURANÇA (5 min):**

```python
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)

# CORS seguro
CORS(app, origins=['https://granroyalle-visitantes.vercel.app'])

# Rate limiting
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

# Headers de segurança
@app.after_request
def after_request(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    return response
```

---

## 📊 **MONITORAMENTO DE SEGURANÇA**

### **🔍 Logs Críticos:**
```python
import logging
import json
from datetime import datetime

# Configurar logging seguro
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('security.log'),
        logging.StreamHandler()
    ]
)

def log_security_event(event_type, details):
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'type': event_type,
        'ip': request.remote_addr,
        'user_agent': request.headers.get('User-Agent'),
        'details': details
    }
    logging.info(f"SECURITY: {json.dumps(log_entry)}")

# Usar em pontos críticos:
@app.route('/api/visitante', methods=['POST'])
@require_api_key
def create_visitor():
    log_security_event('VISITOR_CREATE_ATTEMPT', {
        'visitor_id': request.json.get('id', 'unknown')
    })
    # ... código
```

### **📈 Métricas em Tempo Real:**
```python
from collections import defaultdict
import time

# Contadores de segurança
security_metrics = {
    'total_requests': 0,
    'failed_auth': 0,
    'rate_limited': 0,
    'successful_operations': 0,
    'last_reset': time.time()
}

@app.route('/api/metrics', methods=['GET'])
@require_api_key  # Apenas com API key
def get_metrics():
    return jsonify(security_metrics)
```

---

## 🎯 **CRONOGRAMA DE IMPLEMENTAÇÃO**

### **📅 HOJE (Emergência):**
- [x] ✅ Análise crítica concluída
- [ ] 🔥 Instalar Cloudflare Tunnel
- [ ] 🔐 Adicionar autenticação API
- [ ] 🛡️ Implementar rate limiting

### **📅 ESTA SEMANA:**
- [ ] 🌐 Migrar para API Gateway Vercel
- [ ] 📊 Implementar monitoramento completo
- [ ] 🧪 Teste de penetração

### **📅 PRÓXIMO MÊS:**
- [ ] ☁️ Considerar VPN + Cloud se necessário
- [ ] 🔄 Auditoria de segurança completa

---

## 🚨 **ALERTA CRÍTICO**

**ATÉ A CORREÇÃO SER IMPLEMENTADA:**

### **❌ RISCOS ATIVOS:**
- Qualquer pessoa pode acessar sua API
- Dados pessoais (CPF, fotos) em trânsito não criptografado
- Credenciais do HikCentral expostas
- Possibilidade de ataques DDoS

### **🛡️ MITIGAÇÃO TEMPORÁRIA:**
1. **Mudar porta** da API (de 5001 para porta aleatória)
2. **API key obrigatória** em TODAS as rotas
3. **Whitelist de IPs** se possível
4. **Monitoramento ativo** dos logs

---

## 📞 **PARA O CYBERSECURITY EXPERT:**

**STATUS:** 🚨 **VULNERABILIDADE CRÍTICA IDENTIFICADA**

### **🔍 Descobertas:**
- ✅ Frontend: HTTPS seguro
- ✅ Banco: HTTPS seguro  
- ❌ **API de Automação: HTTP público inseguro**

### **🛠️ Soluções Prontas:**
- 🚀 **Cloudflare Tunnel** (5 min para implementar)
- 🔐 **API Gateway Vercel** (arquitetura completa)
- 🛡️ **Autenticação e Rate Limiting** (código pronto)

### **⏰ Urgência:**
**CRÍTICA** - Implementação em **< 24 horas**

**🎯 Após correção: Sistema 100% HTTPS seguro**

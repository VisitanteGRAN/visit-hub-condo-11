# 🚀 SETUP RÁPIDO - VISIT HUB COM NOVA AUTOMAÇÃO

## ❌ **PROBLEMA ATUAL:**
```
Failed to load resource: the server responded with a status of 500 ()
❌ Erro na API Selenium: Erro interno do servidor
```

## ✅ **SOLUÇÃO:**
O frontend estava tentando usar a **API antiga** (`/api/hikcentral-selenium`) que não funciona. Agora usa a **nova API de automação** 100% funcional!

---

## 🛠️ **CONFIGURAÇÃO EM 5 PASSOS:**

### **PASSO 1: Configurar Variáveis de Ambiente**
```bash
# No diretório raiz do projeto
cp env.local.example .env.local

# Editar .env.local com seus dados
nano .env.local
```

**Conteúdo mínimo do `.env.local`:**
```bash
# API de Automação (OBRIGATÓRIO)
VITE_AUTOMATION_SERVER_URL=http://localhost:5001
VITE_AUTOMATION_API_KEY=hik_automation_2024_secure_key

# HikCentral (OBRIGATÓRIO)
HIKCENTRAL_URL=http://45.4.132.189:3389
HIKCENTRAL_USERNAME=luca  
HIKCENTRAL_PASSWORD=Luca123#
```

### **PASSO 2: Instalar Dependências Python**
```bash
# Instalar dependências do sistema de automação
pip install Pillow psutil Flask Flask-CORS selenium webdriver-manager
```

### **PASSO 3: Iniciar Servidor de Automação**
```bash
# Em um terminal separado
cd visit-hub-condo-11
python3 automation_server_production.py
```

**✅ Sucesso esperado:**
```
✅ Banco de dados inicializado
✅ AutomationQueueManager iniciado com 3 workers
🚀 Iniciando servidor de automação HikCentral em modo produção
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5001
```

### **PASSO 4: Testar API de Automação**
```bash
# Em outro terminal, testar se funciona
curl http://localhost:5001/api/health
```

**✅ Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-22T14:25:30.825Z",
  "version": "2.0.0",
  "queue_stats": {
    "queue_size": 0,
    "active_automations": 0,
    "max_workers": 3
  }
}
```

### **PASSO 5: Iniciar Frontend**
```bash
# No diretório do projeto
npm install
npm run dev
```

---

## 🧪 **TESTE COMPLETO:**

### **1. Acessar Frontend**
```
http://localhost:5173
```

### **2. Fazer Cadastro de Visitante**
1. Preencher dados do visitante
2. **Capturar foto** (webcam ou upload)
3. Submeter formulário
4. Aguardar automação

### **3. Resultado Esperado**
```
✅ Automação iniciada com sucesso!
📸 Foto recebida e processada pelo servidor  
⏳ Aguardando na fila de processamento...
🤖 Executando automação no HikCentral...
✅ Automação concluída com sucesso!
🎉 Visitante cadastrado com sucesso no HikCentral!
📸 Foto do rosto registrada para reconhecimento facial!
```

---

## 🔍 **VERIFICAÇÕES DE FUNCIONAMENTO:**

### **✅ Servidor de Automação:**
```bash
# Health check
curl http://localhost:5001/api/health

# Estatísticas
curl -H "Authorization: Bearer hik_automation_2024_secure_key" \
     http://localhost:5001/api/hikcentral/stats
```

### **✅ Frontend:**
- [ ] Variáveis `VITE_AUTOMATION_*` configuradas
- [ ] Serviço `automationService` carregando
- [ ] Conexão com servidor de automação OK
- [ ] Captura de foto funcionando

### **✅ Backend de Automação:**
- [ ] Porta 5001 aberta e respondendo
- [ ] Workers iniciados (3 por padrão)
- [ ] Banco SQLite criado (`automation.db`)
- [ ] Diretórios `photos/` e `temp/` criados

---

## 🐛 **PROBLEMAS COMUNS:**

### **Erro: "VITE_AUTOMATION_SERVER_URL não definido"**
```bash
# Verificar se .env.local existe e tem as variáveis
cat .env.local

# Se não existir, copiar do exemplo
cp env.local.example .env.local
```

### **Erro: "Servidor de automação não está disponível"**
```bash
# Verificar se servidor está rodando
curl http://localhost:5001/api/health

# Se não responder, iniciar servidor
python3 automation_server_production.py
```

### **Erro: "Pillow não encontrado"**
```bash
pip install Pillow
```

### **Erro: "Chrome/ChromeDriver"**
```bash
# Ubuntu/Debian
sudo apt install google-chrome-stable

# Verificar se funciona
python3 test_real_hikcentral_automated.py --visitor-id test123 --headless
```

---

## 📊 **MONITORAMENTO EM TEMPO REAL:**

### **Logs do Servidor:**
```bash
# Terminal onde roda o servidor mostra logs em tempo real
python3 automation_server_production.py
```

### **Logs Salvos:**
```bash
# Ver logs detalhados
tail -f logs/automation_server.log

# Procurar por erros
grep -i error logs/automation_server.log

# Procurar por sucessos
grep -i "visitante cadastrado" logs/automation_server.log
```

### **Status via API:**
```bash
# Verificar fila
curl -H "Authorization: Bearer hik_automation_2024_secure_key" \
     http://localhost:5001/api/hikcentral/queue

# Status de visitante específico
curl -H "Authorization: Bearer hik_automation_2024_secure_key" \
     http://localhost:5001/api/hikcentral/status/VISITOR_ID
```

---

## 🎯 **TESTE MANUAL RÁPIDO:**

```bash
# Teste via API direta
curl -X POST http://localhost:5001/api/hikcentral/automation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hik_automation_2024_secure_key" \
  -d '{
    "visitor_id": "test_manual_123",
    "visitor_data": {
      "name": "João Teste Manual",
      "phone": "11999999999",
      "rg": "12345678"
    }
  }'
```

**✅ Resposta esperada:**
```json
{
  "success": true,
  "message": "Automação iniciada para visitante test_manual_123",
  "visitor_id": "test_manual_123",
  "status": "queued",
  "timestamp": "2024-01-22T14:25:30.825Z"
}
```

---

## 🎉 **RESULTADO FINAL:**

Após seguir este guia, você terá:

✅ **Frontend atualizado** - Usa nova API em vez da antiga
✅ **Servidor funcionando** - API de automação rodando na porta 5001
✅ **Integração completa** - Frontend → API → Script → HikCentral
✅ **Suporte a fotos** - Upload e processamento automático
✅ **Sistema robusto** - Fila, retry, logs, monitoramento

**🚀 Sistema pronto para uso em produção!** 
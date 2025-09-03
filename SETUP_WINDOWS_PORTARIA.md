# 🖥️ CONFIGURAÇÃO WINDOWS - COMPUTADOR DA PORTARIA

## 📥 **1. BAIXAR ARQUIVOS NECESSÁRIOS**

Copie estes arquivos do Mac para o Windows:
- `automation_server_production.py`
- `test_real_hikcentral_automated.py`
- `photo_manager.py`
- `production.env`
- `requirements.txt`

## 🐍 **2. INSTALAR PYTHON E DEPENDÊNCIAS**

### Instalar Python 3.11+:
```bash
# Baixar de: https://www.python.org/downloads/
# Marcar: "Add Python to PATH"
```

### Instalar dependências:
```bash
pip install Pillow psutil Flask Flask-CORS selenium webdriver-manager
```

## 🌐 **3. INSTALAR GOOGLE CHROME**
```bash
# Baixar de: https://www.google.com/chrome/
# Instalar normalmente
```

## ⚙️ **4. CONFIGURAR ARQUIVO .env**

Criar arquivo `.env` no Windows com:
```bash
# APIs de Automação
API_KEY=hik_automation_2024_secure_key
MAX_WORKERS=3
RETRY_ATTEMPTS=3
SCRIPT_PATH=./test_real_hikcentral_automated.py

# HikCentral (AJUSTAR CONFORME SEU AMBIENTE)
HIKCENTRAL_URL=http://45.4.132.189:3389
HIKCENTRAL_USERNAME=luca
HIKCENTRAL_PASSWORD=Luca123#

# Configurações
LOG_LEVEL=INFO
DEBUG_MODE=false
HEADLESS_MODE=true
FLASK_HOST=0.0.0.0
FLASK_PORT=5001
```

## 🚀 **5. INICIAR SERVIDOR NO WINDOWS**

```bash
# No CMD ou PowerShell
cd caminho\para\visit-hub-condo-11
python automation_server_production.py
```

**✅ Sucesso esperado:**
```
✅ Banco de dados inicializado
✅ AutomationQueueManager iniciado com 3 workers
🚀 Iniciando servidor de automação HikCentral em modo produção
 * Running on all addresses (0.0.0.0)
 * Running on http://0.0.0.0:5001
```

## 🌍 **6. DESCOBRIR IP DO WINDOWS**

```bash
# No Windows CMD
ipconfig
```

Anote o IP da rede local (ex: `192.168.18.71`)

## 📱 **7. CONFIGURAR FRONTEND NO MAC**

Editar `.env.local` no Mac:
```bash
# Apontar para o IP do Windows
VITE_AUTOMATION_SERVER_URL=http://IP_DO_WINDOWS:5001
VITE_AUTOMATION_API_KEY=hik_automation_2024_secure_key
```

## 🧪 **8. TESTE DE CONECTIVIDADE**

### Do Mac, testar se Windows responde:
```bash
curl http://IP_DO_WINDOWS:5001/api/health
```

### Do Windows, verificar se recebe requisições:
```bash
# Logs mostrarão requisições vindas do Mac
```

## 📂 **9. ESTRUTURA DE PASTAS NO WINDOWS**

```
C:\visit-hub-portaria\
├── photos\                     # 📸 FOTOS PERMANENTES
│   ├── visitor_joao_abc123_1699123456_photo_1699123456.jpg
│   └── visitor_joao_abc123_1699123456_photo_1699123456.json
├── temp\                       # 📄 FOTOS TEMPORÁRIAS
│   └── automation_visitor_joao_abc123_1699123456_1699123460.jpg
├── logs\                       # 📋 LOGS
│   └── automation_server.log
└── automation.db               # 🗄️ BANCO DE DADOS
```

## 🔍 **10. MONITORAMENTO**

### Ver logs em tempo real:
```bash
# Windows
type logs\automation_server.log
```

### Verificar fotos recebidas:
```bash
dir photos\
dir temp\
```

### API de status:
```bash
curl http://localhost:5001/api/hikcentral/stats
```

## 🎯 **FLUXO COMPLETO DE TESTE:**

1. **Windows** → Servidor rodando na porta 5001
2. **Mac** → Frontend apontando para IP do Windows
3. **Cadastro** → Mac envia dados + foto → Windows recebe
4. **Processamento** → Windows salva foto → Executa automação
5. **Resultado** → HikCentral recebe visitante com foto
6. **Cleanup** → Windows remove foto temporária, mantém permanente

## 🔥 **COMANDOS RÁPIDOS:**

### Iniciar servidor (Windows):
```bash
python automation_server_production.py
```

### Testar do Mac:
```bash
curl http://IP_WINDOWS:5001/api/health
```

### Ver fotos no Windows:
```bash
dir photos\ /b
```

### Parar servidor (Windows):
```bash
Ctrl+C
```

---

## 🎉 **RESULTADO ESPERADO:**

- ✅ Mac faz cadastros com foto
- ✅ Windows recebe e processa tudo
- ✅ Fotos ficam organizadas no Windows
- ✅ HikCentral recebe visitantes automaticamente
- ✅ Sistema funciona igual ao ambiente real da portaria! 
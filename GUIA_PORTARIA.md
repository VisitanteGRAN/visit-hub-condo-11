# 🏢 GUIA COMPLETO - CONFIGURAÇÃO PORTARIA

## 📋 **CHECKLIST PRÉ-INSTALAÇÃO**

### **Hardware Necessário:**
- ✅ PC Windows/Linux com acesso à internet
- ✅ Mínimo 4GB RAM, 10GB espaço livre
- ✅ Acesso à rede local do condomínio
- ✅ PC ligado 24/7 (já configurado)

### **Credenciais Necessárias:**
- ✅ URL HikCentral: `http://45.4.132.189:3389/#/`
- ✅ Usuário: `luca`
- ✅ Senha: `Luca123#`

---

## 🔧 **PASSO 1: INSTALAÇÃO SOFTWARE (10 min)**

### **A. Instalar Python 3.8+ (se não instalado):**
```bash
# Windows: Baixar de python.org
# Linux Ubuntu/Debian:
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Linux CentOS/RHEL:
sudo yum install python3 python3-pip
```

### **B. Instalar Google Chrome (se não instalado):**
```bash
# Windows: Baixar de google.com/chrome
# Linux Ubuntu/Debian:
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install google-chrome-stable
```

---

## 📁 **PASSO 2: CONFIGURAÇÃO ARQUIVOS (5 min)**

### **A. Criar pasta do projeto:**
```bash
mkdir /opt/hikcentral-automation
cd /opt/hikcentral-automation
```

### **B. Copiar arquivos necessários:**
- `hikcentral_automation.py`
- `hikcentral_automation_server.py` 
- `requirements.txt`
- `hikcentral_automation_config.env`

### **C. Configurar arquivo .env:**
```bash
# Editar hikcentral_automation_config.env
HIKCENTRAL_AUTOMATION_API_KEY=automation-key-2024
HIKCENTRAL_AUTOMATION_PORT=5001
HIKCENTRAL_URL=http://45.4.132.189:3389/#/
HIKCENTRAL_USERNAME=luca
HIKCENTRAL_PASSWORD=Luca123#
HIKCENTRAL_AUTO_RESTART=true
HIKCENTRAL_QUEUE_PROCESSING=true
```

---

## 🐍 **PASSO 3: CONFIGURAÇÃO PYTHON (5 min)**

### **A. Criar ambiente virtual:**
```bash
cd /opt/hikcentral-automation
python3 -m venv venv
```

### **B. Ativar ambiente:**
```bash
# Linux/Mac:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

### **C. Instalar dependências:**
```bash
pip install -r requirements.txt
```

---

## 🚀 **PASSO 4: CONFIGURAÇÃO SERVIÇO 24/7 (10 min)**

### **A. Linux - Criar serviço systemd:**
```bash
sudo nano /etc/systemd/system/hikcentral-automation.service
```

**Conteúdo do arquivo:**
```ini
[Unit]
Description=HikCentral Automation Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/hikcentral-automation
Environment=PATH=/opt/hikcentral-automation/venv/bin
ExecStart=/opt/hikcentral-automation/venv/bin/python hikcentral_automation_server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### **B. Ativar serviço:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable hikcentral-automation
sudo systemctl start hikcentral-automation
```

### **C. Windows - Criar serviço com NSSM:**
```cmd
# Baixar NSSM de nssm.cc
nssm install "HikCentral Automation" "C:\path\to\python.exe" "C:\path\to\hikcentral_automation_server.py"
nssm set "HikCentral Automation" Start SERVICE_AUTO_START
sc start "HikCentral Automation"
```

---

## ✅ **PASSO 5: TESTE DE FUNCIONAMENTO (5 min)**

### **A. Verificar se o serviço está rodando:**
```bash
# Linux:
sudo systemctl status hikcentral-automation
curl http://localhost:5001/api/health

# Windows:
sc query "HikCentral Automation"
curl http://localhost:5001/api/health
```

### **B. Verificar logs:**
```bash
# Linux:
sudo journalctl -u hikcentral-automation -f

# Windows:
# Verificar logs em C:\Windows\System32\LogFiles\
```

---

## 🔥 **CONFIGURAÇÃO FIREWALL**

### **A. Liberar porta 5001:**
```bash
# Linux (ufw):
sudo ufw allow 5001

# Linux (iptables):
sudo iptables -A INPUT -p tcp --dport 5001 -j ACCEPT

# Windows:
# Painel de Controle > Sistema e Segurança > Firewall do Windows
# Adicionar regra de entrada TCP porta 5001
```

---

## 📱 **PASSO 6: CONFIGURAÇÃO NO BACKEND VISITHUB**

### **A. Configurar URL da API da portaria:**
```bash
# No arquivo .env do backend VisitHub:
HIKCENTRAL_AUTOMATION_API_URL=http://IP_DA_PORTARIA:5001
HIKCENTRAL_AUTOMATION_API_KEY=automation-key-2024
```

**⚠️ Substituir `IP_DA_PORTARIA` pelo IP real do PC da portaria!**

---

## 🎯 **COMANDOS ÚTEIS**

### **Reiniciar serviço:**
```bash
# Linux:
sudo systemctl restart hikcentral-automation

# Windows:
sc stop "HikCentral Automation"
sc start "HikCentral Automation"
```

### **Ver logs em tempo real:**
```bash
# Linux:
sudo journalctl -u hikcentral-automation -f

# Manual:
tail -f /opt/hikcentral-automation/automation.log
```

### **Verificar status:**
```bash
curl http://localhost:5001/api/health
```

---

## 🆘 **TROUBLESHOOTING**

### **Problema: Serviço não inicia**
```bash
# Verificar logs
sudo journalctl -u hikcentral-automation
# Verificar permissões
sudo chown -R root:root /opt/hikcentral-automation
```

### **Problema: Chrome não encontrado**
```bash
# Instalar ChromeDriver manualmente
sudo apt install chromium-chromedriver
```

### **Problema: Porta ocupada**
```bash
# Verificar porta
sudo netstat -tlnp | grep 5001
# Matar processo
sudo kill -9 PID
```

---

## ✅ **CHECKLIST FINAL**

- [ ] Python 3.8+ instalado
- [ ] Google Chrome instalado  
- [ ] Arquivos copiados para `/opt/hikcentral-automation`
- [ ] Ambiente virtual criado e ativado
- [ ] Dependências instaladas
- [ ] Arquivo .env configurado
- [ ] Serviço systemd/Windows configurado
- [ ] Serviço iniciado e ativo
- [ ] Porta 5001 liberada no firewall
- [ ] Teste de conectividade funcionando
- [ ] IP da portaria configurado no backend VisitHub

---

## 🎉 **SISTEMA PRONTO!**

O sistema agora está configurado para funcionar **24/7** com:
- ✅ **Auto-restart** em caso de falha
- ✅ **Processamento de fila** para múltiplos cadastros
- ✅ **Logs detalhados** para monitoramento
- ✅ **Recuperação automática** após queda de energia 

Vejo que:
- ✅ **Servidor rodando** na porta 5001
- ✅ **3 workers ativos** funcionando
- ✅ **Banco de dados** inicializado
- ✅ **Sistema de fila** funcionando

O problema agora é que os testes estão falhando na submissão. Vamos investigar o que está acontecendo:

## 🔍 **INVESTIGANDO O PROBLEMA**

Vamos verificar os logs do servidor para entender por que os cadastros estão falhando. No terminal do servidor, você deve ver logs de erro.

##  **TESTE MANUAL VIA CURL**

Vamos testar manualmente a API para ver o que está acontecendo. Abra um **terceiro terminal** e execute:

```cmd
# Teste 1: Health Check
curl http://localhost:5001/api/health

# Teste 2: Submissão manual
curl -X POST http://localhost:5001/api/hikcentral/automation ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: automation-key-2024" ^
  -d "{\"visitor_id\":\"test_001\",\"visitor_data\":{\"name\":\"Teste\",\"cpf\":\"12345678901\",\"phone\":\"31999999999\"}}"
```

## 🔧 **VERIFICANDO CONFIGURAÇÃO**

Vamos verificar se o arquivo `.env` está correto. No terminal:

```cmd
# Verificar conteúdo do arquivo .env
type hikcentral_automation_config.env
```

##  **TESTE ALTERNATIVO**

Vamos criar um teste mais simples para debugar. Crie um arquivo `test_simple.py`:

```python
import requests
import json

# Configurações
API_URL = "http://localhost:5001"
API_KEY = "automation-key-2024"

# Teste simples
def test_simple():
    print("🧪 Teste Simples da API")
    print("="*40)
    
    # 1. Health Check
    print("1. Testando Health Check...")
    try:
        response = requests.get(f"{API_URL}/api/health", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: {data.get('status')}")
            print(f"   Workers: {data.get('queue_stats', {}).get('max_workers')}")
        else:
            print(f"   Erro: {response.text}")
    except Exception as e:
        print(f"   Erro: {e}")
    
    print()
    
    # 2. Submissão simples
    print("2. Testando Submissão...")
    try:
        data = {
            "visitor_id": "test_simple_001",
            "visitor_data": {
                "name": "Teste Simples",
                "cpf": "12345678901",
                "phone": "31999999999"
            }
        }
        
        response = requests.post(
            f"{API_URL}/api/hikcentral/automation",
            headers={
                "Content-Type": "application/json",
                "X-API-Key": API_KEY
            },
            json=data,
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Sucesso: {result.get('success')}")
            print(f"   Mensagem: {result.get('message')}")
        else:
            print(f"   Erro: {response.text}")
            
    except Exception as e:
        print(f"   Erro: {e}")
    
    print()
    print("🏁 Teste concluído!")

if __name__ == "__main__":
    test_simple()
```

##  **EXECUTANDO TESTE SIMPLES**

```cmd
# Terminal 3 - Teste simples:
cd "C:\Users\GM Informática\Desktop\visit"
venv\Scripts\activate.bat
python test_simple.py
```

##  **VERIFICANDO LOGS DO SERVIDOR**

No terminal do servidor, você deve ver logs como:
```
INFO - Added pending automation for visitor test_simple_001
INFO - Worker X processing visitor test_simple_001
```

##  **POSSÍVEIS PROBLEMAS:**

1. **API Key incorreta** - verificar se está igual no .env e no teste
2. **Formato dos dados** - verificar se o JSON está correto
3. **CORS** - verificar se o servidor está aceitando requisições
4. **Timeout** - verificar se não está muito baixo

## 📊 **RESULTADO ESPERADO:**

**Terminal 1 (Servidor):**
```
INFO - Added pending automation for visitor test_simple_001
INFO - Worker 0 processing visitor test_simple_001
```

**Terminal 3 (Teste):**
```
🧪 Teste Simples da API
========================================
1. Testando Health Check...
   Status: 200
   Status: healthy
   Workers: 3

2. Testando Submissão...
   Status: 200
   Sucesso: True
   Mensagem: Automation queued for visitor test_simple_001

🏁 Teste concluído!
```

**Execute o teste simples e me diga o que aparece!** 🔍

Isso vai nos ajudar a identificar exatamente onde está o problema. 
# 🖥️ **GUIA COMPLETO - WINDOWS**

## 📋 **PRÉ-REQUISITOS**

### **Software Necessário:**
- ✅ **Python 3.8+** - [Download Python](https://python.org)
- ✅ **Google Chrome** - [Download Chrome](https://google.com/chrome)
- ✅ **Git** (opcional) - [Download Git](https://git-scm.com)

### **⚠️ IMPORTANTE:**
Ao instalar Python, **MARQUE** a opção:
- ✅ **"Add Python to PATH"**

---

## 🚀 **INSTALAÇÃO AUTOMÁTICA (RECOMENDADO)**

### **Passo 1: Executar script de instalação**
```cmd
# Clique duas vezes no arquivo:
install_windows.bat
```

**O script irá:**
- ✅ Verificar Python e Chrome
- ✅ Criar ambiente virtual
- ✅ Instalar dependências
- ✅ Configurar arquivo .env

---

## 🔧 **INSTALAÇÃO MANUAL**

### **Passo 1: Verificar Python**
```cmd
python --version
pip --version
```

### **Passo 2: Criar ambiente virtual**
```cmd
python -m venv venv
```

### **Passo 3: Ativar ambiente virtual**
```cmd
venv\Scripts\activate.bat
```

### **Passo 4: Instalar dependências**
```cmd
pip install -r requirements.txt
```

---

## ⚙️ **CONFIGURAÇÃO**

### **Passo 1: Configurar arquivo .env**
Edite `hikcentral_automation_config.env`:

```ini
HIKCENTRAL_AUTOMATION_API_KEY=automation-key-2024
HIKCENTRAL_AUTOMATION_PORT=5001
HIKCENTRAL_URL=http://45.4.132.189:3389/#/
HIKCENTRAL_USERNAME=luca
HIKCENTRAL_PASSWORD=Luca123#
HIKCENTRAL_AUTO_RESTART=true
HIKCENTRAL_QUEUE_PROCESSING=true
```

---

## 🧪 **EXECUTANDO OS TESTES**

### **Opção 1: Script automático (RECOMENDADO)**
```cmd
# Clique duas vezes no arquivo:
start_test_windows.bat
```

### **Opção 2: Comandos manuais**

#### **Terminal 1 - Servidor:**
```cmd
cd C:\caminho\para\projeto
venv\Scripts\activate.bat
python hikcentral_automation_server_24x7.py
```

#### **Terminal 2 - Testes:**
```cmd
cd C:\caminho\para\projeto
venv\Scripts\activate.bat
python test_quick_3_visitors.py
```

---

## 📊 **O QUE ESPERAR**

### **✅ Sucesso:**
```
🚀 [12:00:01] Submetendo João Silva...
✅ [12:00:01] João Silva adicionado à fila!
🚀 [12:00:02] Submetendo Maria Costa...
✅ [12:00:02] Maria Costa adicionado à fila!
🚀 [12:00:03] Submetendo Pedro Lima...
✅ [12:00:03] Pedro Lima adicionado à fila!

📊 FILA: 0 | ATIVAS: 3 | WORKERS: 3
```

### **❌ Problemas comuns:**

#### **1. "Python não é reconhecido"**
```cmd
# Reinstalar Python marcando "Add Python to PATH"
# Ou adicionar manualmente ao PATH:
set PATH=%PATH%;C:\Python39;C:\Python39\Scripts
```

#### **2. "pip não é reconhecido"**
```cmd
# Usar python -m pip:
python -m pip install requests
```

#### **3. "Chrome não encontrado"**
- ✅ Baixar e instalar Chrome
- ✅ Verificar se está em `C:\Program Files\Google\Chrome\`

#### **4. "Porta 5001 ocupada"**
```cmd
# Verificar porta:
netstat -an | findstr 5001

# Matar processo:
taskkill /PID NUMERO_DO_PROCESSO /F
```

---

## 🔍 **VERIFICAÇÕES**

### **Verificar se tudo está funcionando:**
```cmd
# 1. Verificar Python
python --version

# 2. Verificar pip
pip --version

# 3. Verificar Chrome
dir "C:\Program Files\Google\Chrome\Application\chrome.exe"

# 4. Verificar ambiente virtual
dir venv\Scripts\activate.bat

# 5. Verificar dependências
pip list
```

---

## 📁 **ESTRUTURA DE ARQUIVOS**

```
visit-hub-condo-11/
├── 📁 venv/                    # Ambiente virtual Python
├── 📄 install_windows.bat      # Script de instalação
├── 📄 start_test_windows.bat   # Script de teste
├── 📄 hikcentral_automation_server_24x7.py  # Servidor
├── 📄 test_quick_3_visitors.py # Teste rápido
├── 📄 requirements.txt          # Dependências
├── 📄 hikcentral_automation_config.env      # Configuração
└── 📄 GUIA_WINDOWS.md          # Este guia
```

---

## 🎯 **FLUXO DE TESTE COMPLETO**

### **1. Instalação (uma vez):**
```cmd
install_windows.bat
```

### **2. Configuração (uma vez):**
- Editar `hikcentral_automation_config.env`
- Verificar credenciais HikCentral

### **3. Teste (sempre que quiser):**
```cmd
start_test_windows.bat
```

---

## 🆘 **TROUBLESHOOTING AVANÇADO**

### **Problema: Ambiente virtual não ativa**
```cmd
# Tentar ativação manual:
venv\Scripts\activate.bat

# Se der erro, recriar:
rmdir /s venv
python -m venv venv
venv\Scripts\activate.bat
```

### **Problema: Dependências não instalam**
```cmd
# Atualizar pip:
python -m pip install --upgrade pip

# Instalar uma por vez:
pip install Flask
pip install selenium
pip install webdriver-manager
```

### **Problema: Firewall bloqueia**
- ✅ Verificar Windows Defender
- ✅ Adicionar exceção para porta 5001
- ✅ Verificar antivírus

---

## 📞 **SUPORTE**

### **Se nada funcionar:**
1. ✅ Verificar se Python está no PATH
2. ✅ Verificar se Chrome está instalado
3. ✅ Verificar se porta 5001 está livre
4. ✅ Verificar logs de erro

### **Comandos de diagnóstico:**
```cmd
# Verificar PATH:
echo %PATH%

# Verificar processos Python:
tasklist | findstr python

# Verificar portas:
netstat -an | findstr 5001

# Verificar variáveis de ambiente:
set | findstr PYTHON
```

---

## 🎉 **SISTEMA PRONTO!**

Após seguir este guia, você terá:
- ✅ **Servidor de automação** rodando na porta 5001
- ✅ **Sistema de fila** com 3 workers simultâneos
- ✅ **Testes automatizados** funcionando
- ✅ **Sistema 24/7** configurado

**Agora é só executar os testes e ver o sistema funcionando!** 🚀

---

## 💡 **DICAS IMPORTANTES**

1. **Sempre ative o ambiente virtual** antes de executar comandos
2. **Use dois terminais** - um para servidor, outro para testes
3. **Verifique os logs** se algo der errado
4. **Teste primeiro** antes de configurar na portaria

**Boa sorte com os testes!** 🎯 
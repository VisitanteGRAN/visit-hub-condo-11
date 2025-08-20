# 🏢 Sistema de Automação HikCentral

Sistema automatizado para cadastro de visitantes no HikCentral através de interface web e API.

## 🎯 **Funcionalidades**

- ✅ **Interface Web**: Formulário simples para cadastro de visitantes
- ✅ **API REST**: Endpoints para integração com outros sistemas
- ✅ **Automação Selenium**: Preenchimento automático no HikCentral
- ✅ **Banco de Dados**: Armazenamento local com SQLite
- ✅ **Processamento em Background**: Cadastros processados automaticamente
- ✅ **Monitoramento**: Acompanhamento do status dos cadastros

## 🏗️ **Arquitetura**

```
┌─────────────────────────────────────────────────┐
│  INTERFACE WEB (Flask)                         │
│  http://localhost:5000                         │
│  ┌─────────────────────────────────────────────┐ │
│  │  Formulário de Cadastro                    │ │
│  │  - Nome, CPF, Telefone, Email             │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│  API REST (Flask)                              │
│  /api/visitors                                 │
│  ┌─────────────────────────────────────────────┐ │
│  │  POST /visitors - Criar visitante          │ │
│  │  GET /visitors - Listar visitantes         │ │
│  │  GET /visitors/{id} - Status do visitante  │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│  BANCO DE DADOS (SQLite)                       │
│  visitors.db                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Tabela: visitors                          │ │
│  │  - id, name, cpf, phone, email            │ │
│  │  - status, created_at, processed_at        │ │
│  │  - result, error_message                   │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│  AUTOMAÇÃO SELENIUM                            │
│  Background Process                            │
│  ┌─────────────────────────────────────────────┐ │
│  │  - Login no HikCentral                     │ │
│  │  - Navegação para formulário               │ │
│  │  - Preenchimento automático                │ │
│  │  - Upload de foto                          │ │
│  │  - Submissão do cadastro                   │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│  HIKCENTRAL                                    │
│  Sistema de Controle de Acesso                 │
│  ┌─────────────────────────────────────────────┐ │
│  │  - Cadastro de visitantes                  │ │
│  │  - Controle de entrada/saída               │ │
│  │  - Gestão de moradores                     │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 🚀 **Instalação e Configuração**

### **1. Pré-requisitos**

- Python 3.8+
- Google Chrome instalado
- Acesso ao HikCentral (IP, usuário, senha)

### **2. Clonar/Download do Projeto**

```bash
cd /caminho/para/projeto
```

### **3. Criar Ambiente Virtual**

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

### **4. Instalar Dependências**

```bash
pip install -r requirements.txt
```

### **5. Configurar Variáveis de Ambiente**

```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar arquivo .env com suas credenciais
nano .env
```

**Configurações obrigatórias no .env:**
```env
# Configurações do HikCentral
HIKCENTRAL_URL=http://SEU_IP_HIKCENTRAL:PORTA
HIKCENTRAL_USERNAME=seu_usuario
HIKCENTRAL_PASSWORD=sua_senha

# Configurações do Chrome
CHROME_HEADLESS=False  # True para rodar sem interface gráfica
```

### **6. Iniciar o Sistema**

```bash
# Opção 1: Script de inicialização (recomendado)
python start_system.py

# Opção 2: Iniciar manualmente
python app.py
```

## 🌐 **Como Usar**

### **Interface Web**

1. **Acesse**: http://localhost:5000
2. **Preencha o formulário**:
   - Nome completo (obrigatório)
   - CPF (opcional)
   - Telefone (opcional)
   - Email (opcional)
3. **Clique em "Cadastrar Visitante"**
4. **Acompanhe o status** em tempo real

### **API REST**

#### **Criar Visitante**
```bash
curl -X POST http://localhost:5000/api/visitors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "cpf": "123.456.789-00",
    "phone": "(11) 99999-9999",
    "email": "joao@email.com"
  }'
```

#### **Verificar Status**
```bash
curl http://localhost:5000/api/visitors/1
```

#### **Listar Visitantes**
```bash
curl http://localhost:5000/api/visitors
```

## 📊 **Status dos Cadastros**

- **`pending`**: Aguardando processamento
- **`processing`**: Sendo processado no HikCentral
- **`completed`**: Cadastrado com sucesso
- **`error`**: Erro durante o processamento

## 🔧 **Configurações Avançadas**

### **Chrome Headless (Sem Interface Gráfica)**

Para rodar em servidores sem interface gráfica:

```env
CHROME_HEADLESS=True
```

### **Timeouts e Retry**

```env
SELENIUM_TIMEOUT=30        # Timeout para elementos Selenium
PAGE_LOAD_TIMEOUT=60       # Timeout para carregamento de página
MAX_RETRIES=3              # Tentativas máximas em caso de erro
RETRY_DELAY=5              # Delay entre tentativas
```

### **Logs**

```env
LOG_LEVEL=INFO             # DEBUG, INFO, WARNING, ERROR
LOG_FILE=hikcentral_automation.log
```

## 🚨 **Solução de Problemas**

### **Chrome não inicia**

```bash
# Verificar se o Chrome está instalado
google-chrome --version

# Verificar se o ChromeDriver está funcionando
python -c "from selenium import webdriver; from webdriver_manager.chrome import ChromeDriverManager; print('ChromeDriver OK')"
```

### **Erro de login no HikCentral**

1. Verificar IP, porta e credenciais no arquivo `.env`
2. Testar acesso manual ao HikCentral
3. Verificar se o usuário tem permissões

### **Elementos não encontrados**

1. Verificar se o HikCentral foi atualizado
2. Ajustar seletores no arquivo `hikcentral_automation.py`
3. Verificar screenshots de debug salvos

### **Popup não fecha**

1. Verificar se há interferências do navegador
2. Ajustar seletores do popup
3. Verificar se o popup mudou de estrutura

## 📁 **Estrutura de Arquivos**

```
visit-hub-condo-11/
├── app.py                      # Aplicação Flask principal
├── hikcentral_automation.py   # Script de automação Selenium
├── config.py                  # Configurações do sistema
├── start_system.py            # Script de inicialização
├── requirements.txt           # Dependências Python
├── env.example               # Exemplo de variáveis de ambiente
├── templates/                 # Templates HTML
│   └── index.html            # Interface web
├── README-SISTEMA.md         # Esta documentação
└── venv/                     # Ambiente virtual Python
```

## 🔒 **Segurança**

- **Autenticação**: Implementar autenticação se necessário
- **HTTPS**: Usar HTTPS em produção
- **Firewall**: Restringir acesso à porta 5000
- **Logs**: Monitorar logs de acesso e erros

## 📈 **Monitoramento e Manutenção**

### **Logs do Sistema**

```bash
# Ver logs em tempo real
tail -f hikcentral_automation.log

# Ver logs do Flask
tail -f flask.log
```

### **Banco de Dados**

```bash
# Acessar banco SQLite
sqlite3 visitors.db

# Ver visitantes
SELECT * FROM visitors ORDER BY created_at DESC;

# Ver estatísticas
SELECT status, COUNT(*) FROM visitors GROUP BY status;
```

### **Backup**

```bash
# Backup do banco
cp visitors.db visitors_backup_$(date +%Y%m%d).db

# Backup completo
tar -czf backup_$(date +%Y%m%d).tar.gz .
```

## 🚀 **Deploy em Produção**

### **Usando Gunicorn**

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### **Usando Systemd (Linux)**

```bash
# Criar serviço systemd
sudo nano /etc/systemd/system/hikcentral-automation.service

[Unit]
Description=HikCentral Automation System
After=network.target

[Service]
Type=simple
User=seu_usuario
WorkingDirectory=/caminho/para/projeto
Environment=PATH=/caminho/para/projeto/venv/bin
ExecStart=/caminho/para/projeto/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target

# Ativar serviço
sudo systemctl enable hikcentral-automation
sudo systemctl start hikcentral-automation
```

### **Usando Docker**

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "app.py"]
```

## 📞 **Suporte**

Para problemas ou dúvidas:

1. **Verificar logs** do sistema
2. **Consultar esta documentação**
3. **Verificar configurações** no arquivo `.env`
4. **Testar manualmente** o acesso ao HikCentral

## 🔄 **Atualizações**

Para atualizar o sistema:

1. **Fazer backup** do banco de dados
2. **Atualizar código** do projeto
3. **Reinstalar dependências** se necessário
4. **Reiniciar** o sistema

---

**🎉 Sistema pronto para uso!**

Configure suas credenciais do HikCentral e comece a cadastrar visitantes automaticamente! 
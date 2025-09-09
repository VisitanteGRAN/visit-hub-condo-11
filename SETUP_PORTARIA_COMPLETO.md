# 🏢 SETUP COMPLETO PARA PORTARIA - HIKCENTRAL AUTOMATION

## 📁 ARQUIVOS NECESSÁRIOS NO PC DA PORTARIA

### 1. **SCRIPTS PRINCIPAIS:**
```
windows_polling_service_final.py    # Serviço principal de monitoramento
test_form_direct.py                 # Script de cadastro de visitantes NOVOS
test_reactivate_visitor.py          # Script de reativação de visitantes EXISTENTES
windows.env                         # Configurações (renomear para .env)
```

### 2. **ARQUIVOS DE SUPORTE:**
```
start_polling_service.bat           # Script para iniciar serviço
requirements.txt                    # Lista de dependências Python
```

## 🛠️ DEPENDÊNCIAS PARA INSTALAR

### 1. **PYTHON 3.8+**
```bash
# Baixar em: https://www.python.org/downloads/
# ⚠️ IMPORTANTE: Marcar "Add Python to PATH" durante instalação
```

### 2. **CHROME BROWSER**
```bash
# Baixar em: https://www.google.com/chrome/
# Instalar versão mais recente
```

### 3. **BIBLIOTECAS PYTHON:**
```bash
pip install selenium==4.15.0
pip install webdriver-manager==4.0.1
pip install requests==2.31.0
pip install python-dotenv==1.0.0
pip install supabase==2.0.0
```

### 4. **INSTALAR TUDO DE UMA VEZ:**
```bash
pip install -r requirements.txt
```

## ⚙️ CONFIGURAÇÃO

### 1. **Arquivo .env (renomear windows.env):**
```env
SUPABASE_URL=https://rnpgtwughapxxvvckepd.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAzMzUzOSwiZXhwIjoyMDcwNjA5NTM5fQ.2t6m1iUk_TRXtbEACh-P6dKJWRqyeLBe1OrUZemFd90
POLL_INTERVAL=5
HIKCENTRAL_URL=http://192.168.1.100:8090
HIKCENTRAL_USERNAME=admin
HIKCENTRAL_PASSWORD=admin123
```

### 2. **ATUALIZAR IP DO HIKCENTRAL:**
- Alterar `HIKCENTRAL_URL` para o IP correto da portaria
- Exemplo: `HIKCENTRAL_URL=http://192.168.1.50:8090`

## 🚀 COMO INICIAR

### **MÉTODO 1 - DUPLO CLIQUE:**
```
1. Duplo clique em: start_polling_service.bat
2. Janela do CMD irá abrir
3. Sistema ficará monitorando automaticamente
```

### **MÉTODO 2 - LINHA DE COMANDO:**
```bash
cd C:\Users\[SEU_USUARIO]\Desktop\windows_package
python windows_polling_service_final.py
```

## 📊 LOGS E MONITORAMENTO

### **ARQUIVO DE LOG:**
```
polling_service.log    # Registra todas as atividades
```

### **MENSAGENS NO CMD:**
```
[INFO] Aguardando novos itens...           # Sistema funcionando
[QUEUE] Item encontrado: [ID]              # Visitante detectado
[PROCESS] Processando: [NOME]              # Iniciando cadastro
[SUCCESS] CADASTRO FINALIZADO COM ENTRADA! # Sucesso completo
```

## ⚠️ TROUBLESHOOTING

### **ERRO: "Python não reconhecido"**
```
Solução: Reinstalar Python marcando "Add to PATH"
```

### **ERRO: "Chrome não encontrado"**
```
Solução: Instalar Google Chrome mais recente
```

### **ERRO: "Selenium não funciona"**
```
Solução: pip install --upgrade selenium webdriver-manager
```

### **ERRO: "Supabase connection failed"**
```
Solução: Verificar internet e chaves no arquivo .env
```

## 🎯 TESTE RÁPIDO

### **1. Verificar se tudo está funcionando:**
```bash
python test_form_direct.py
```

### **2. Testar conexão Supabase:**
```bash
python windows_polling_service_final.py
# Deve mostrar: "[INFO] Aguardando novos itens..."
```

## 📱 SISTEMA COMPLETO

### **FLUXO COMPLETO INTELIGENTE:**
```
1. 🌐 Morador acessa: https://visit-hub-condo-11-h2nbgufzi-rota-rep.vercel.app
2. 🔍 Digita CPF e clica "Verificar CPF"
3A. SE VISITANTE NOVO:
   📝 Preenche dados completos + foto
   ☁️ Envia para fila como "create"
   🤖 Windows executa cadastro completo (90s)
3B. SE VISITANTE CONHECIDO:
   ⚡ Apenas confirma dados existentes
   ☁️ Envia para fila como "reactivate"
   🤖 Windows executa reativação rápida (45s)
4. ✅ Sistema finaliza automaticamente!
```

## 🔧 COMANDOS ÚTEIS

### **Parar serviço:**
```
Ctrl + C no CMD
```

### **Reiniciar serviço:**
```
Fechar CMD e duplo clique em start_polling_service.bat
```

### **Ver logs em tempo real:**
```
type polling_service.log
```

## ✅ CHECKLIST FINAL

- [ ] Python 3.8+ instalado
- [ ] Chrome instalado
- [ ] Dependências pip instaladas
- [ ] Arquivo .env configurado com IP correto
- [ ] Arquivo start_polling_service.bat presente
- [ ] Teste executado com sucesso
- [ ] Sistema monitorando fila Supabase

## 🎉 SISTEMA PRONTO!

**Agora o sistema está 100% operacional 24/7!**

- ✅ Frontend na Vercel
- ✅ Database na Supabase  
- ✅ Polling no Windows
- ✅ Automação HikCentral
- ✅ Botão Entrada implementado

**🚀 PRONTO PARA PRODUÇÃO NA PORTARIA!**

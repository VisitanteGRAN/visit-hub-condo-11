# 🔄 ATUALIZAÇÃO PARA PORTARIA - DUAL WORKERS

## 📋 **ARQUIVOS PARA ATUALIZAR:**

### **🎯 OBRIGATÓRIOS (Substituir na portaria):**

```
✅ windows_polling_service_final.py  ← PRINCIPAL (agora com dual workers)
✅ test_form_direct.py               ← Script de cadastro
✅ test_reactivate_visitor.py        ← Script de reativação
```

### **🚀 OPCIONAIS (Novos recursos):**

```
🆕 windows_polling_dual_workers.py  ← Sistema avançado (opcional)
🆕 start_dual_workers.bat          ← Iniciar sistema avançado
```

### **🔧 MANTER (Não alterar):**

```
🔒 .env                            ← Configurações atuais
🔒 start_automation_service_windows.bat ← Funcionará com dual workers
🔒 install_windows_service.bat     ← Auto-start atual
```

---

## 📂 **COMO ATUALIZAR:**

### **1. Parar Serviço Atual:**
```cmd
# No computador da portaria:
Ctrl+C (se rodando manual)
# OU
taskkill /f /im python.exe
```

### **2. Fazer Backup:**
```cmd
# Backup dos arquivos atuais:
copy windows_polling_service_final.py windows_polling_service_final.py.backup
copy test_form_direct.py test_form_direct.py.backup  
copy test_reactivate_visitor.py test_reactivate_visitor.py.backup
```

### **3. Substituir Arquivos:**
```
📁 Copiar do seu PC para portaria:
   ├── windows_polling_service_final.py  (SUBSTITUIR)
   ├── test_form_direct.py              (SUBSTITUIR)
   ├── test_reactivate_visitor.py       (SUBSTITUIR)
   └── windows_polling_dual_workers.py  (NOVO - opcional)
```

---

## 🧪 **TESTAR NO SEU PC PRIMEIRO:**

### **1. Copiar Arquivos:**
```cmd
# Criar pasta de teste:
mkdir C:\visit-hub-test
cd C:\visit-hub-test

# Copiar arquivos:
copy windows_polling_service_final.py .
copy test_form_direct.py .
copy test_reactivate_visitor.py .
copy .env .
```

### **2. Testar Dual Workers:**
```cmd
# Teste 1 - Sistema atual com dual workers:
python windows_polling_service_final.py

# Deve mostrar:
# [INFO] MODO DUAL WORKERS ATIVADO - 2 CADASTROS SIMULTÂNEOS!
# ✅ Worker 1 thread iniciada
# ✅ Worker 2 thread iniciada
```

### **3. Cadastrar 2 Visitantes Simultâneos:**
```
1. Abra PWA em 2 abas
2. Cadastre visitante A
3. Imediatamente cadastre visitante B
4. Observe logs: Worker 1 e Worker 2 processando
```

---

## 🛑 **DESABILITAR AUTO-START (Para teste):**

### **MÉTODO 1 - Registro do Windows:**
```cmd
# Abrir como Administrador:
regedit

# Navegar para:
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run

# Procurar entradas:
- "VisitHubAutomation"
- "HikCentralService" 
- "WindowsPollingService"

# DELETAR a entrada encontrada
```

### **MÉTODO 2 - Gerenciador de Tarefas:**
```
1. Ctrl+Shift+Esc (Gerenciador de Tarefas)
2. Aba "Inicializar"
3. Procurar por "VisitHub" ou "Python"
4. Clicar com botão direito → "Desabilitar"
```

### **MÉTODO 3 - Serviços do Windows:**
```cmd
# Abrir como Administrador:
services.msc

# Procurar serviços:
- "VisitHubAutomation"
- "HikCentralService"

# Clicar direito → "Propriedades"
# Tipo de inicialização: "Manual"
# Status: "Parar"
```

### **MÉTODO 4 - NSSM (Se usado):**
```cmd
# Abrir CMD como Administrador:
nssm stop VisitHubService
nssm remove VisitHubService confirm
```

---

## ✅ **VERIFICAR SE DESABILITOU:**

### **Reiniciar PC e verificar:**
```cmd
# Verificar se NÃO está rodando:
tasklist | findstr python
tasklist | findstr chrome

# Deve retornar vazio
```

---

## 🔄 **REABILITAR AUTO-START (Depois do teste):**

### **Se era Registro:**
```cmd
# Adicionar de volta ao registro:
reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "VisitHubAutomation" /t REG_SZ /d "C:\caminho\para\start_automation_service_windows.bat"
```

### **Se era Serviço:**
```cmd
# Recriar serviço:
install_windows_service.bat
```

---

## 📊 **O QUE ESPERAR:**

### **🎯 Dual Workers Ativo:**
```
Logs mostrarão:
[INFO] MODO DUAL WORKERS ATIVADO - 2 CADASTROS SIMULTÂNEOS!
✅ Worker 1 thread iniciada  
✅ Worker 2 thread iniciada
[QUEUE] 2 item(s) encontrado(s)
📝 Worker 1 processando: abc123
📝 Worker 2 processando: def456
```

### **⚡ Performance Esperada:**
```
📊 Antes: 1 cadastro por vez (~3 min cada)
📊 Agora:  2 cadastros simultâneos (~1.5 min cada)
📊 Total: 2x mais rápido para condomínio grande!
```

---

## 🆘 **TROUBLESHOOTING:**

### **❌ Se der erro:**
```cmd
# Voltar versão anterior:
copy windows_polling_service_final.py.backup windows_polling_service_final.py

# Testar versão single:
python windows_polling_service_final.py
```

### **❌ Se dual workers não aparecer:**
```cmd
# Verificar imports:
python -c "import threading, queue"

# Se erro, instalar:
pip install --upgrade threading queue
```

---

## 🎯 **RESUMO RÁPIDO:**

1. **Testar no seu PC primeiro** ✅
2. **Desabilitar auto-start** (registro/serviços) ✅  
3. **Substituir 3 arquivos** na portaria ✅
4. **Testar dual workers** funcionando ✅
5. **Reabilitar auto-start** ✅

**Agora você tem dual workers funcionando perfeitamente! 🚀**

# 🚀 VISIT HUB - MANUAL DE INSTALAÇÃO NO WINDOWS

## 📋 **PRÉ-REQUISITOS**

1. ✅ **Python 3.8+** instalado e no PATH
2. ✅ **Google Chrome** instalado
3. ✅ **Conexão com internet** (para instalar dependências)
4. ✅ **Acesso ao HikCentral** funcionando

## 📁 **ARQUIVOS NECESSÁRIOS**

Certifique-se de que estes arquivos estão na pasta:

```
✅ windows_polling_service_final.py
✅ test_form_direct.py  
✅ test_reactivate_visitor.py
✅ start_automation_service_windows.bat
✅ install_windows_service.bat
✅ install_startup_registry.bat
✅ .env (com configurações do Supabase)
```

---

## 🔧 **OPÇÃO 1: INSTALAÇÃO COMO SERVIÇO (RECOMENDADO)**

### **Vantagens:**
- ✅ Inicia automaticamente com o Windows
- ✅ Executa mesmo sem usuário logado
- ✅ Reinicia automaticamente se falhar
- ✅ Controle via `services.msc`

### **Passos:**

1. **Executar como Administrador:**
   ```batch
   Botão direito → install_windows_service.bat → "Executar como administrador"
   ```

2. **Aguardar instalação:**
   - Script verifica dependências
   - Instala serviço no Windows
   - Configura inicialização automática

3. **Gerenciar serviço:**
   ```batch
   # Iniciar manualmente
   sc start VisitHubAutomation
   
   # Parar
   sc stop VisitHubAutomation
   
   # Ver status
   sc query VisitHubAutomation
   
   # Remover (se necessário)
   sc delete VisitHubAutomation
   ```

---

## 🔧 **OPÇÃO 2: INICIALIZAÇÃO VIA REGISTRO**

### **Vantagens:**
- ✅ Mais simples de instalar
- ✅ Não precisa de privilégios de administrador
- ✅ Fácil de remover

### **Desvantagens:**
- ❌ Só funciona quando usuário está logado
- ❌ Não reinicia automaticamente se falhar

### **Passos:**

1. **Executar instalador:**
   ```batch
   Duplo clique → install_startup_registry.bat
   ```

2. **Confirmar opções:**
   - Criar atalho na área de trabalho? (Sim/Não)

3. **Pronto!** O sistema iniciará automaticamente

---

## 🔧 **OPÇÃO 3: EXECUÇÃO MANUAL**

Para testar ou execução pontual:

```batch
# Executar uma vez
start_automation_service_windows.bat
```

---

## 📊 **VERIFICAÇÃO DE FUNCIONAMENTO**

### **Logs:**
```
📄 polling_service.log - Log principal do sistema
📄 Chrome logs - Na pasta do script
```

### **Sinais de sucesso:**
```
[INFO] Iniciando polling loop...
[QUEUE] Verificando fila Supabase...
[FOUND] Item encontrado: [ID]
[CREATE/REACTIVATE] Processando visitante...
[SUCCESS] Processamento concluído!
```

### **Teste manual:**
1. Criar link de visitante no sistema web
2. Cadastrar visitante via link
3. Verificar logs para confirmar processamento

---

## 🛠️ **SOLUÇÃO DE PROBLEMAS**

### **Python não encontrado:**
```batch
# Verificar se Python está no PATH
python --version

# Se não funcionar, adicionar ao PATH ou reinstalar Python
```

### **Erro de dependências:**
```batch
# Instalar manualmente
pip install selenium webdriver-manager python-dotenv requests
```

### **Chrome não funciona:**
```batch
# Verificar se Chrome está instalado
# Versão mais recente recomendada
```

### **Arquivo .env não encontrado:**
```
Criar arquivo .env com:
SUPABASE_URL=sua_url_aqui
SUPABASE_SERVICE_KEY=sua_chave_aqui
```

### **Serviço não inicia:**
```batch
# Verificar logs
type polling_service.log

# Testar execução manual primeiro
start_automation_service_windows.bat
```

---

## 🔄 **ATUALIZAÇÃO DO SISTEMA**

Para atualizar os scripts:

1. **Parar serviço:**
   ```batch
   sc stop VisitHubAutomation
   ```

2. **Substituir arquivos:**
   - Copiar novos scripts para a pasta
   - Manter arquivo `.env`

3. **Reiniciar serviço:**
   ```batch
   sc start VisitHubAutomation
   ```

---

## 📞 **SUPORTE**

- 📄 **Logs detalhados:** `polling_service.log`
- 🔍 **Debug:** Executar `start_automation_service_windows.bat` manualmente
- ⚙️ **Configurações:** Arquivo `.env`

---

## ✅ **RESUMO FINAL**

O sistema agora roda **24x7 em modo headless** (sem janelas visíveis) e:

- ✅ Inicia automaticamente com o Windows
- ✅ Processa cadastros novos
- ✅ Reativa visitantes existentes  
- ✅ Associa visitantes aos moradores
- ✅ Reinicia automaticamente se falhar
- ✅ Logs detalhados para monitoramento

**Sistema completamente autônomo e robusto!** 🚀

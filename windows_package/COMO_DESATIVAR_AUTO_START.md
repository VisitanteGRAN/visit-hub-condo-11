# 🛑 COMO DESATIVAR AUTO-INICIALIZAÇÃO - VISIT HUB

## 📖 **PARA TESTES NO SEU WINDOWS:**

Quando você estiver testando, pode querer desativar a auto-inicialização para que o sistema não fique rodando 24h no seu PC pessoal.

---

## 🔧 **MÉTODOS DE DESATIVAÇÃO:**

### **MÉTODO 1: Startup do Windows (Mais comum)**

1. **Pressione:** `Win + R`
2. **Digite:** `shell:startup`
3. **Pressione:** Enter
4. **Procure:** `VisitHub_PollingService.lnk`
5. **Clique com botão direito** → **Deletar**

### **MÉTODO 2: Gerenciador de Tarefas**

1. **Pressione:** `Ctrl + Shift + Esc`
2. **Vá na aba:** "Inicializar"
3. **Procure:** "Visit Hub - Servico de Polling"
4. **Clique com botão direito** → **Desabilitar**

### **MÉTODO 3: Configurações do Windows 10/11**

1. **Pressione:** `Win + I`
2. **Vá em:** Aplicativos → Inicialização
3. **Procure:** "Visit Hub"
4. **Desligue** o switch

---

## 🏢 **PARA REATIVAR NA PORTARIA:**

Quando quiser colocar na portaria para funcionar 24h:

1. **Execute:** `install_service.bat`
2. **Escolha opção:** `1` (Startup)
3. **Pronto!** Sistema volta a iniciar automaticamente

---

## 🔄 **SERVIÇO WINDOWS (Método 2 do installer)**

Se você usou a **Opção 2** (Serviço Windows):

### **Para PARAR o serviço:**
```cmd
python service_wrapper.py stop
```

### **Para REMOVER o serviço:**
```cmd
python service_wrapper.py remove
```

### **Para REATIVAR o serviço:**
```cmd
python service_wrapper.py install
python service_wrapper.py start
```

---

## ⚠️ **IMPORTANTE:**

- **No seu PC:** Desative após testes
- **Na portaria:** Mantenha ativo 24h
- **Para testar:** Use `start_polling_service.bat` manualmente

---

## 🧪 **TESTE MANUAL (SEM AUTO-START):**

Para testar sem ativar auto-inicialização:

1. **Execute:** `start_polling_service.bat`
2. **Teste** cadastros
3. **Feche** o terminal quando terminar

**Assim não fica rodando automaticamente!** ✅ 
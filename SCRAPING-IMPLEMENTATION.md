# 🤖 **IMPLEMENTAÇÃO SCRAPING HIKCENTRAL**

## 🎯 **CONCEITO:**

**Automatizar o cadastro de visitantes no HikCentral via interface web usando um "robô" (bot) que simula ações humanas.**

## ✅ **VANTAGENS:**

### **🔧 Técnicas:**
- ✅ **Sem APIs** complexas
- ✅ **Sem configurações** de rede
- ✅ **Funciona com qualquer** versão do HikCentral
- ✅ **Interface web** já existe e funciona
- ✅ **Upload de fotos** automático

### **💼 Operacionais:**
- ✅ **Processo automatizado** 24/7
- ✅ **Reduz erros** humanos
- ✅ **Escalável** para muitos visitantes
- ✅ **Logs detalhados** de cada operação

## 🚀 **ARQUITETURA:**

### **📱 Frontend (React):**
- Visitante preenche formulário
- Foto é capturada/enviada
- Sistema salva no banco Supabase
- **Bot é acionado** automaticamente

### **🤖 Bot (Puppeteer):**
- **Navegador headless** (invisível)
- Acessa HikCentral local
- Faz login automático
- Preenche formulário
- Faz upload da foto
- Salva visitante

### **🏢 HikCentral:**
- Recebe dados via interface web
- Processa normalmente
- Distribui para coletores
- **Tudo automático!**

## 🔧 **IMPLEMENTAÇÃO:**

### **1. 📦 Instalar Dependências:**
```bash
npm install puppeteer
npm install @types/puppeteer --save-dev
```

### **2. 🖥️ Configurar Servidor Local:**
```bash
# Na portaria, instalar Node.js
# Criar serviço que roda 24/7
# Configurar para iniciar com Windows
```

### **3. 🔄 Fluxo de Integração:**
```typescript
// 1. Visitante preenche dados
const visitorData = {
  nome: "João Silva",
  cpf: "12345678901",
  foto: "base64_ou_caminho_local",
  // ... outros dados
};

// 2. Sistema salva no banco
await supabase.from('visitantes').insert(visitorData);

// 3. Bot é acionado
const result = await hikCentralScrapingService.createVisitor(visitorData);

// 4. HikCentral processa automaticamente
if (result.success) {
  console.log('✅ Visitante criado:', result.hikCentralId);
}
```

## 🎨 **INTERFACE DO BOT:**

### **🔐 Login Automático:**
```typescript
await page.goto('http://192.168.1.200:3389/login');
await page.type('#username', 'luca');
await page.type('#password', 'Luca123#');
await page.click('.login-btn');
```

### **📝 Preenchimento Automático:**
```typescript
// Mapear campos do HikCentral
const fieldMappings = {
  'name': visitorData.nome,
  'cpf': visitorData.cpf,
  'phone': visitorData.telefone,
  'email': visitorData.email,
  'document': visitorData.documento
};

// Preencher cada campo
for (const [field, value] of Object.entries(fieldMappings)) {
  await page.type(`input[name="${field}"]`, value);
}
```

### **📸 Upload de Foto:**
```typescript
// Fazer upload da foto
const fileInput = await page.$('input[type="file"]');
await fileInput.uploadFile(visitorData.fotoPath);

// Aguardar upload completar
await page.waitForTimeout(2000);
```

## 🏗️ **ESTRUTURA DE ARQUIVOS:**

```
src/
├── services/
│   ├── hikCentralScrapingService.ts  # Bot principal
│   └── webSDKService.ts              # Integração existente
├── pages/
│   ├── CadastroVisitante.tsx         # Formulário
│   └── TesteHikvision.tsx            # Diagnóstico
└── utils/
    └── scrapingHelpers.ts            # Funções auxiliares
```

## 🔄 **FLUXO COMPLETO:**

### **1. 🏠 Morador (de casa):**
- Acessa sistema web
- Cria convite para visitante
- Sistema gera link único

### **2. 👤 Visitante (de qualquer lugar):**
- Clica no link
- Preenche dados + tira foto
- Sistema salva no banco

### **3. 🤖 Bot (na portaria):**
- Detecta visitante pendente
- Acessa HikCentral automaticamente
- Preenche formulário
- Faz upload da foto
- Salva visitante

### **4. 🏢 HikCentral:**
- Processa dados normalmente
- Distribui para coletores
- Visitante pode acessar

## 🚀 **DEPLOY:**

### **🌐 Frontend (Vercel):**
- Sistema web responsivo
- PWA instalável
- Banco Supabase

### **🖥️ Bot (Portaria):**
- Servidor local Windows
- Node.js + Puppeteer
- Serviço automático

### **🔗 Integração:**
- Webhook ou polling
- Comunicação via HTTP
- Logs detalhados

## 💡 **VANTAGENS DESTA ABORDAGEM:**

### **✅ Simplicidade:**
- **Sem APIs** complexas
- **Sem configurações** de rede
- **Interface existente** funciona

### **✅ Confiabilidade:**
- **Processo testado** (interface web)
- **Fallback automático** se falhar
- **Logs detalhados** para debug

### **✅ Escalabilidade:**
- **Múltiplos visitantes** simultâneos
- **Processamento em lote**
- **Fila de prioridades**

## 🎯 **PRÓXIMOS PASSOS:**

### **1. 🔧 Configurar Ambiente:**
- Instalar Puppeteer
- Configurar HikCentral local
- Testar conectividade

### **2. 🧪 Testar Scraping:**
- Login automático
- Preenchimento de campos
- Upload de fotos

### **3. 🚀 Integrar Sistema:**
- Conectar com banco
- Automatizar processo
- Monitorar logs

### **4. 📊 Produção:**
- Deploy em servidor local
- Configurar serviço automático
- Monitorar performance

## 🏆 **RESULTADO FINAL:**

**Sistema 100% automatizado:**
- ✅ **Morador** cria convite de qualquer lugar
- ✅ **Visitante** preenche dados online
- ✅ **Bot** cadastra automaticamente no HikCentral
- ✅ **HikCentral** distribui para coletores
- ✅ **Visitante** acessa condomínio

**Sem APIs, sem configurações complexas, apenas automação inteligente! 🚀** 
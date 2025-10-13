# 🚀 Gran Royalle - Polling Service

## 📁 Arquivos Criados

### 1. `iniciar_polling_service.bat`
- **Função:** Execução manual simples
- **Uso:** Duplo clique para testar o script
- **Comportamento:** Executa uma vez e para

### 2. `polling_service_auto_restart.bat` ⭐ **RECOMENDADO**
- **Função:** Execução com reinicialização automática
- **Uso:** Para uso em produção
- **Comportamento:** Se o script parar, reinicia automaticamente em 10s

### 3. `configurar_inicializacao_automatica.bat`
- **Função:** Configura inicialização automática no Windows
- **Uso:** Execute como administrador (botão direito > "Executar como administrador")
- **Comportamento:** Cria tarefa no Agendador de Tarefas do Windows

---

## 🛠️ Instruções de Instalação

### Passo 1: Copiar Arquivos
1. Copie todos os arquivos `.bat` para: `C:\Users\Gran Royalle\Desktop\windows_package\`
2. Certifique-se de que `windows_polling_service_final.py` está na mesma pasta

### Passo 2: Testar Manualmente
1. Duplo clique em `iniciar_polling_service.bat`
2. Verifique se o script executa sem erros
3. Feche a janela para parar

### Passo 3: Configurar Auto-Restart (Produção)
1. Duplo clique em `polling_service_auto_restart.bat`
2. O script ficará rodando e reiniciará automaticamente se parar
3. Para parar: feche a janela do CMD

### Passo 4: Configurar Inicialização Automática
1. **Clique com botão direito** em `configurar_inicializacao_automatica.bat`
2. Selecione **"Executar como administrador"**
3. Aguarde a confirmação de sucesso
4. Reinicie o PC para testar

---

## 🔧 Comandos Úteis

### Verificar se a tarefa foi criada:
```cmd
schtasks /query /tn "Gran Royalle Polling Service"
```

### Executar a tarefa manualmente:
```cmd
schtasks /run /tn "Gran Royalle Polling Service"
```

### Remover a inicialização automática:
```cmd
schtasks /delete /tn "Gran Royalle Polling Service" /f
```

---

## 📋 Estrutura de Pastas

```
C:\Users\Gran Royalle\Desktop\windows_package\
├── windows_polling_service_final.py          # Script principal
├── iniciar_polling_service.bat               # Execução simples
├── polling_service_auto_restart.bat          # Auto-restart ⭐
├── configurar_inicializacao_automatica.bat   # Configuração automática
└── test_form_direct.py                       # Script de automação
```

---

## ✅ Verificação Final

Após configurar tudo:

1. **✅ Reinicie o PC**
2. **✅ O script deve iniciar automaticamente**
3. **✅ Verifique se a janela do CMD aparece**
4. **✅ Teste cadastrando um visitante**
5. **✅ Confirme se aparece no HikCentral**

---

## 🆘 Solução de Problemas

### Problema: "Diretório não encontrado"
- **Solução:** Verifique se o caminho está correto: `C:\Users\Gran Royalle\Desktop\windows_package\`

### Problema: "Arquivo Python não encontrado"
- **Solução:** Certifique-se de que `windows_polling_service_final.py` está na pasta

### Problema: "Erro ao criar tarefa automática"
- **Solução:** Execute como administrador (botão direito > "Executar como administrador")

### Problema: Script não inicia automaticamente
- **Solução:** Verifique no Agendador de Tarefas se a tarefa "Gran Royalle Polling Service" existe

---

## 📞 Suporte

Em caso de dúvidas, verifique:
1. Logs do script Python
2. Agendador de Tarefas do Windows
3. Permissões de administrador
4. Caminho dos arquivos

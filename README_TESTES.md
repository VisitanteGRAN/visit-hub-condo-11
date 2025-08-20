# 🧪 SCRIPTS DE TESTE - SISTEMA HIKCENTRAL

## 📋 **VISÃO GERAL**

Este diretório contém scripts para testar o sistema de automação HikCentral com múltiplos cadastros simultâneos. Os scripts demonstram como funciona o sistema de fila com 3 workers processando cadastros simultaneamente.

---

## 🚀 **SCRIPTS DISPONÍVEIS**

### **1. `test_multiple_visitors.py` - Teste Completo**
**Descrição:** Script completo com menu interativo para testar múltiplos cenários.

**Funcionalidades:**
- ✅ Teste de 3 cadastros simultâneos
- ✅ Teste de cadastro único
- ✅ Verificação de estatísticas da fila
- ✅ Monitoramento em tempo real
- ✅ Geração automática de dados fictícios

**Como usar:**
```bash
python test_multiple_visitors.py
```

**Opções disponíveis:**
1. **Teste de múltiplos cadastros** - Submete 3 visitantes simultaneamente
2. **Teste de cadastro único** - Testa um visitante individual
3. **Verificar estatísticas** - Mostra status atual da fila
4. **Sair** - Encerra o script

---

### **2. `test_quick_3_visitors.py` - Teste Rápido**
**Descrição:** Script simplificado para teste rápido de 3 cadastros.

**Funcionalidades:**
- ✅ Submissão rápida de 3 visitantes
- ✅ Delays escalonados (0s, 1s, 2s)
- ✅ Verificação de estatísticas
- ✅ Sem interação do usuário

**Como usar:**
```bash
python test_quick_3_visitors.py
```

**O que acontece:**
1. Submete João Silva (0s delay)
2. Submete Maria Costa (1s delay)  
3. Submete Pedro Lima (2s delay)
4. Mostra estatísticas da fila
5. Aguarda processamento
6. Mostra estatísticas finais

---

### **3. `demo_queue_system.py` - Demonstração Visual**
**Descrição:** Script interativo com demonstração visual do sistema de fila.

**Funcionalidades:**
- ✅ Visualização gráfica da fila
- ✅ Status dos workers em tempo real
- ✅ Monitoramento contínuo
- ✅ Cenários de demonstração

**Como usar:**
```bash
python demo_queue_system.py
```

**Cenários disponíveis:**
1. **Cenário 1:** 3 cadastros simultâneos com visualização
2. **Cenário 2:** Monitoramento em tempo real da fila
3. **Status atual:** Verificar estado atual da fila

---

## 🔧 **PRÉ-REQUISITOS**

### **A. Servidor rodando:**
```bash
# Terminal 1 - Iniciar servidor
python hikcentral_automation_server_24x7.py
```

### **B. Dependências instaladas:**
```bash
pip install requests
```

### **C. Configuração correta:**
- ✅ Servidor rodando na porta 5001
- ✅ API Key configurada: `automation-key-2024`
- ✅ URL correta: `http://localhost:5001`

---

## 📊 **O QUE OS TESTES DEMONSTRAM**

### **🎯 Sistema de Fila:**
- ✅ **3 workers simultâneos** processando cadastros
- ✅ **Fila FIFO** (primeiro a entrar, primeiro a sair)
- ✅ **Processamento paralelo** sem conflitos
- ✅ **Status tracking** em tempo real

### **🔄 Fluxo de Processamento:**
```
Visitante 1 → Worker 1 (processando)
Visitante 2 → Worker 2 (processando)  
Visitante 3 → Worker 3 (processando)
Visitante 4 → Fila (aguardando)
```

### **📈 Estatísticas Monitoradas:**
- 🔄 **Tamanho da fila** - quantos aguardando
- ⚙️ **Automações ativas** - quantos processando
- ⏳ **Pendentes no banco** - quantos salvos
- 👥 **Máximo de workers** - capacidade do sistema

---

## 🧪 **EXECUTANDO OS TESTES**

### **Passo 1: Iniciar o servidor**
```bash
# Terminal 1
cd /caminho/para/projeto
python hikcentral_automation_server_24x7.py
```

### **Passo 2: Executar teste**
```bash
# Terminal 2
python test_quick_3_visitors.py
```

### **Passo 3: Verificar logs**
```bash
# Terminal 1 - ver logs do servidor
tail -f automation.log
```

---

## 📊 **INTERPRETAÇÃO DOS RESULTADOS**

### **✅ Sucesso esperado:**
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
1. **Servidor não responde** - Verificar se está rodando
2. **API Key inválida** - Verificar configuração
3. **Porta ocupada** - Verificar se porta 5001 está livre
4. **Dependências faltando** - Instalar `requests`

---

## 🔍 **MONITORAMENTO AVANÇADO**

### **A. Logs do servidor:**
```bash
tail -f automation.log
```

### **B. Status da fila via API:**
```bash
curl -H "X-API-Key: automation-key-2024" \
     http://localhost:5001/api/hikcentral/queue/stats
```

### **C. Health check:**
```bash
curl http://localhost:5001/api/health
```

---

## 🎯 **CENÁRIOS DE TESTE**

### **Cenário 1: Cadastros Sequenciais**
- Submete 1 visitante por vez
- Demonstra processamento individual
- Bom para verificar funcionamento básico

### **Cenário 2: Cadastros Simultâneos**
- Submete 3+ visitantes rapidamente
- Demonstra sistema de fila
- Bom para testar capacidade

### **Cenário 3: Sobrecarga**
- Submete 10+ visitantes
- Demonstra comportamento sob pressão
- Bom para testar estabilidade

---

## 🆘 **TROUBLESHOOTING**

### **Problema: "Servidor não está rodando"**
```bash
# Verificar se porta está ocupada
netstat -tlnp | grep 5001

# Verificar se processo está rodando
ps aux | grep hikcentral
```

### **Problema: "API Key inválida"**
```bash
# Verificar arquivo de configuração
cat hikcentral_automation_config.env

# Verificar se API_KEY está correto
echo $HIKCENTRAL_AUTOMATION_API_KEY
```

### **Problema: "Connection refused"**
```bash
# Verificar firewall
sudo ufw status

# Verificar se servidor está escutando
curl -v http://localhost:5001/api/health
```

---

## 📝 **EXEMPLO DE EXECUÇÃO COMPLETA**

```bash
# Terminal 1 - Servidor
$ python hikcentral_automation_server_24x7.py
Starting HikCentral Automation Server on port 5001
Auto-restart: true
Queue processing: true
Max workers: 3

# Terminal 2 - Teste
$ python test_quick_3_visitors.py
🎯 TESTE RÁPIDO - 3 CADASTROS SIMULTÂNEOS
==================================================
🕐 Início: 12:00:01
🌐 API: http://localhost:5001
==================================================
✅ Servidor funcionando!

📋 VISITANTES:
   1. João Silva (CPF: 12345678901) - Delay: 0s
   2. Maria Costa (CPF: 98765432109) - Delay: 1s
   3. Pedro Lima (CPF: 11122233344) - Delay: 2s

🚀 INICIANDO SUBMISSÕES...
🚀 [12:00:01] Submetendo João Silva...
✅ [12:00:01] João Silva adicionado à fila!
🚀 [12:00:02] Submetendo Maria Costa...
✅ [12:00:02] Maria Costa adicionado à fila!
🚀 [12:00:03] Submetendo Pedro Lima...
✅ [12:00:03] Pedro Lima adicionado à fila!

✅ TODOS SUBMETIDOS!

📊 FILA: 0 | ATIVAS: 3 | WORKERS: 3

⏳ Aguardando processamento...
📊 FILA: 0 | ATIVAS: 0 | WORKERS: 3

🏁 Teste concluído às 12:01:15
💡 Verifique os logs do servidor para mais detalhes
```

---

## 🎉 **SISTEMA FUNCIONANDO!**

Quando você vê:
- ✅ **3 workers ativos** processando simultaneamente
- ✅ **Fila vazia** após submissão
- ✅ **Status atualizado** em tempo real
- ✅ **Logs detalhados** no servidor

**O sistema está funcionando perfeitamente!** 🚀

---

## 📞 **SUPORTE**

Se encontrar problemas:
1. ✅ Verificar logs do servidor
2. ✅ Verificar conectividade da API
3. ✅ Verificar configurações
4. ✅ Executar testes básicos primeiro

**O sistema foi testado e validado para funcionar 24/7 com múltiplos cadastros simultâneos!** 🎯 
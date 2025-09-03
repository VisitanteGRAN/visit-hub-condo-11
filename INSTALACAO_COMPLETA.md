# 🚀 INSTALAÇÃO COMPLETA - VISIT HUB + AUTOMAÇÃO HIKCENTRAL

## 📋 **RESUMO DO SISTEMA:**

✅ **Script 100% funcional** - `test_real_hikcentral_automated.py`
✅ **Servidor de automação** - `automation_server_production.py`
✅ **Sistema de fila robusto** - Processamento paralelo
✅ **Recuperação automática** - Reinicia após falhas/reboot
✅ **API completa** - Integração com frontend
✅ **Banco de dados persistente** - SQLite com logs

---

## 🎯 **COMO FUNCIONA:**

1. **Visitante preenche formulário** no Visit Hub
2. **Frontend chama API** de automação
3. **Servidor adiciona à fila** de processamento
4. **Worker executa script** no HikCentral
5. **Cadastro automático** é realizado
6. **Status atualizado** em tempo real

---

## 🛠️ **INSTALAÇÃO:**

### **PASSO 1: Dependências do Sistema**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3 python3-pip python3-venv git curl

# CentOS/RHEL
sudo yum install -y python3 python3-pip git curl

# Instalar Chrome (necessário para automação)
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable
```

### **PASSO 2: Clonar e Configurar Projeto**
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/visit-hub-condo-11.git
cd visit-hub-condo-11

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências Python
pip install -r requirements.txt
pip install psutil requests flask selenium webdriver-manager

# Criar diretórios necessários
mkdir -p logs screenshots temp
```

### **PASSO 3: Configurar Variáveis de Ambiente**
```bash
# Copiar arquivo de configuração
cp production.env .env

# Editar configurações
nano .env

# Ajustar conforme necessário:
# - HIKCENTRAL_URL: IP do seu HikCentral
# - HIKCENTRAL_USERNAME: Usuário admin
# - HIKCENTRAL_PASSWORD: Senha admin
# - API_KEY: Chave de segurança (mantenha secreta)
```

### **PASSO 4: Testar Script Individual**
```bash
# Testar script de automação (modo visível)
python3 test_real_hikcentral_automated.py --visitor-id test123

# Testar script headless
python3 test_real_hikcentral_automated.py --visitor-id test123 --headless

# Se funcionou, prossiga para próximo passo
```

### **PASSO 5: Iniciar Servidor de Automação**
```bash
# Iniciar servidor manualmente (para teste)
python3 automation_server_production.py

# Em outro terminal, testar API
curl -X GET http://localhost:5001/api/health

# Se funcionou, prossiga para instalação como serviço
```

### **PASSO 6: Instalar como Serviço do Sistema**
```bash
# Instalar como serviço systemd (executa como root)
sudo python3 start_automation_production.py --install-service

# Iniciar serviço
sudo systemctl start hikcentral-automation

# Verificar status
sudo systemctl status hikcentral-automation

# Habilitar inicialização automática
sudo systemctl enable hikcentral-automation
```

---

## 📊 **MONITORAMENTO:**

### **Verificar Status**
```bash
# Status do serviço
sudo systemctl status hikcentral-automation

# Logs em tempo real
sudo journalctl -u hikcentral-automation -f

# Status via API
curl -X GET http://localhost:5001/api/health

# Estatísticas
curl -H "Authorization: Bearer hik_automation_2024_secure_key" \
     -X GET http://localhost:5001/api/hikcentral/stats
```

### **Comandos Úteis**
```bash
# Parar serviço
sudo systemctl stop hikcentral-automation

# Reiniciar serviço
sudo systemctl restart hikcentral-automation

# Desabilitar inicialização automática
sudo systemctl disable hikcentral-automation

# Ver logs de erro
sudo journalctl -u hikcentral-automation --since "1 hour ago"
```

---

## 🌐 **INTEGRAÇÃO COM FRONTEND:**

### **1. Configurar Frontend**
```bash
# No diretório src/
npm install

# Criar arquivo .env.local
echo "VITE_AUTOMATION_SERVER_URL=http://localhost:5001" > .env.local
echo "VITE_AUTOMATION_API_KEY=hik_automation_2024_secure_key" >> .env.local
```

### **2. Exemplo de Uso no Frontend**
```typescript
import automationService from '@/services/automationService';

// No formulário de visitante
const handleSubmit = async (formData) => {
  // 1. Salvar visitante no banco
  const visitante = await salvarVisitante(formData);
  
  // 2. Iniciar automação
  const visitorId = automationService.generateVisitorId(
    formData.nome, 
    formData.cpf
  );
  
  const automation = await automationService.startAutomation(
    visitorId,
    {
      name: formData.nome,
      phone: formData.telefone,
      rg: formData.documento,
      placa: formData.placaVeiculo
    }
  );
  
  if (automation.success) {
    // 3. Monitorar progresso
    await automationService.monitorAutomation(
      visitorId,
      (status) => {
        console.log('Status:', status.status.status);
        // Atualizar UI com progresso
      }
    );
  }
};
```

---

## ⚡ **TESTE COMPLETO:**

### **1. Teste API Manual**
```bash
# Testar automação via API
curl -X POST http://localhost:5001/api/hikcentral/automation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hik_automation_2024_secure_key" \
  -d '{
    "visitor_id": "test_visitor_123",
    "visitor_data": {
      "name": "João da Silva",
      "phone": "11999999999",
      "rg": "12345678",
      "placa": "ABC1234"
    }
  }'

# Verificar status
curl -X GET http://localhost:5001/api/hikcentral/status/test_visitor_123 \
  -H "Authorization: Bearer hik_automation_2024_secure_key"
```

### **2. Fluxo Completo**
1. **Abrir** o frontend do Visit Hub
2. **Acessar** link de convite válido
3. **Preencher** formulário de visitante
4. **Aguardar** automação no HikCentral
5. **Verificar** cadastro no HikCentral

---

## 🔧 **RESOLUÇÃO DE PROBLEMAS:**

### **Chrome/Driver Issues**
```bash
# Instalar Chrome manualmente
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f

# Verificar versão
google-chrome --version
```

### **Permissões**
```bash
# Dar permissões aos scripts
chmod +x *.py
chmod +x *.sh

# Permissões para logs
sudo chown -R $USER:$USER logs/
chmod 755 logs/
```

### **Firewall**
```bash
# Abrir porta 5001 para automação
sudo ufw allow 5001/tcp

# Verificar portas abertas
sudo netstat -tlnp | grep :5001
```

### **Logs de Debug**
```bash
# Logs detalhados do servidor
tail -f logs/automation_server.log

# Logs do sistema
sudo journalctl -u hikcentral-automation --since today

# Logs de startup
tail -f logs/startup_manager.log
```

---

## 🎉 **FUNCIONALIDADES:**

✅ **Processamento Paralelo** - 3 workers simultâneos
✅ **Fila Inteligente** - Priorização automática
✅ **Recuperação de Falhas** - Retry automático
✅ **Persistência** - Banco SQLite com histórico
✅ **Monitoramento** - Health checks contínuos
✅ **API Completa** - Status, estatísticas, controle
✅ **Logs Detalhados** - Debug completo
✅ **Inicialização Automática** - Serviço systemd
✅ **Múltiplos Visitantes** - Sem conflitos
✅ **Integração Frontend** - React/TypeScript

---

## 📈 **PRÓXIMOS PASSOS:**

1. **Configurar backup** do banco de dados
2. **Implementar notificações** (email/webhook)
3. **Dashboard de administração** 
4. **Métricas avançadas**
5. **Integração com outros sistemas**

---

## 🆘 **SUPORTE:**

- **Logs**: `logs/automation_server.log`
- **Status**: `http://localhost:5001/api/health`
- **Comandos**: `python3 start_automation_production.py --help`

🎯 **Sistema está pronto para produção!** 🚀 
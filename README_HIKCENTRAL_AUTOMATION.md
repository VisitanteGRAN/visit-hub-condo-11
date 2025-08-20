# 🤖 Automação HikCentral - Visit Hub

Sistema automatizado para cadastro de visitantes no HikCentral via Selenium WebDriver.

## 🎯 Visão Geral

Este sistema automatiza completamente o processo de cadastro de visitantes no HikCentral:

1. **Morador gera link** → Salva no Supabase
2. **Visitante preenche formulário** → Salva no Supabase com status `pending_hikcentral`
3. **Sistema automaticamente chama API local** da máquina da portaria
4. **API local executa script Selenium** no HikCentral
5. **Resultado é retornado** para seu sistema
6. **Status é atualizado** no Supabase

## 🚀 Vantagens

- ✅ **Totalmente automático** após o cadastro
- ✅ **Máquina da portaria dedicada** para automação
- ✅ **Seu sistema Vercel** continua funcionando normalmente
- ✅ **Comunicação via HTTP** entre sistemas
- ✅ **Status em tempo real** no Supabase
- ✅ **Retry automático** em caso de falhas
- ✅ **Logs detalhados** para debugging

## 🏗️ Arquitetura

```
[Frontend Vercel] ←→ [Backend Node.js] ←→ [API Python Flask] ←→ [Selenium HikCentral]
       ↓                    ↓                        ↓                    ↓
   Supabase DB         Supabase DB              Logs locais      Sistema HikCentral
```

## 📋 Pré-requisitos

### Máquina da Portaria (Windows/Mac/Linux)
- Python 3.8+
- Chrome/Chromium instalado
- Acesso à rede do HikCentral
- Porta 5000 disponível

### Sistema Principal
- Node.js 18+
- Supabase configurado
- Variáveis de ambiente configuradas

## 🛠️ Instalação

### 1. Máquina da Portaria

#### Opção A: Script Automático (Recomendado)

**Linux/Mac:**
```bash
chmod +x start_automation_server.sh
./start_automation_server.sh
```

**Windows:**
```cmd
start_automation_server.bat
```

#### Opção B: Manual

```bash
# 1. Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate.bat  # Windows

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente
cp hikcentral_automation_config.env.example hikcentral_automation_config.env
# Editar o arquivo com suas configurações

# 4. Executar servidor
python3 hikcentral_automation_server.py
```

### 2. Sistema Principal

#### Configurar Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# URL da API de automação na máquina da portaria
HIKCENTRAL_AUTOMATION_API_URL=http://IP_DA_PORTARIA:5000

# Chave de API para autenticação
HIKCENTRAL_AUTOMATION_API_KEY=sua-chave-secreta-aqui
```

#### Atualizar Banco de Dados

Adicione os novos status à tabela `visitantes`:

```sql
-- Adicionar coluna para ID do HikCentral (se não existir)
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS hikcentral_id TEXT;

-- Atualizar enum de status (se necessário)
-- Os novos status são: pending_hikcentral, hikcentral_success, hikcentral_error
```

## ⚙️ Configuração

### Arquivo de Configuração (`hikcentral_automation_config.env`)

```env
# Chave de API para autenticação
HIKCENTRAL_AUTOMATION_API_KEY=sua-chave-secreta-aqui

# Porta do servidor
HIKCENTRAL_AUTOMATION_PORT=5000

# Configurações do HikCentral
HIKCENTRAL_URL=http://45.4.132.189:3389/#/
HIKCENTRAL_USERNAME=luca
HIKCENTRAL_PASSWORD=Luca123#

# Configurações de timeout
AUTOMATION_TIMEOUT=300000
STATUS_CHECK_TIMEOUT=30000

# Configurações de retry
MAX_RETRIES=3
RETRY_DELAY=5000
```

### Configurações de Segurança

1. **Altere a API Key padrão** para uma chave segura
2. **Configure CORS** para permitir apenas seu domínio
3. **Use HTTPS** em produção
4. **Configure firewall** para permitir apenas conexões necessárias

## 🔄 Fluxo de Funcionamento

### 1. Cadastro do Visitante
```
Visitante preenche formulário → Supabase (status: aguardando)
```

### 2. Início da Automação
```
Sistema detecta novo visitante → Chama API de automação
API atualiza status → pending_hikcentral
```

### 3. Execução da Automação
```
Script Selenium executa → Login no HikCentral → Preenche formulário
```

### 4. Finalização
```
Sucesso → status: hikcentral_success + hikcentral_id
Erro → status: hikcentral_error + detalhes do erro
```

## 📊 Monitoramento

### Logs do Sistema
- **Backend**: Logs no console e arquivo
- **API Python**: `hikcentral_automation.log`
- **Supabase**: Histórico de mudanças de status

### Endpoints de Monitoramento

```bash
# Verificar saúde da API
GET http://IP_DA_PORTARIA:5000/api/health

# Status de uma automação específica
GET http://IP_DA_PORTARIA:5000/api/hikcentral/status/{visitor_id}

# Listar todas as automações
GET http://IP_DA_PORTARIA:5000/api/hikcentral/automations
```

### Status dos Visitantes

- `aguardando` → Visitante cadastrado, aguardando processamento
- `pending_hikcentral` → Automação em andamento
- `hikcentral_success` → Cadastrado com sucesso no HikCentral
- `hikcentral_error` → Falha na automação
- `liberado` → Visitante liberado para entrada
- `ativo` → Visitante ativo no sistema
- `expirado` → Visitante expirado

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. API não responde
```bash
# Verificar se o servidor está rodando
curl http://IP_DA_PORTARIA:5000/api/health

# Verificar logs
tail -f hikcentral_automation.log
```

#### 2. Falha no login do HikCentral
- Verificar credenciais no arquivo de configuração
- Verificar se o site está acessível
- Verificar se as credenciais ainda são válidas

#### 3. Elementos não encontrados
- O site do HikCentral pode ter mudado
- Verificar screenshots de debug salvos
- Atualizar seletores CSS/XPath se necessário

#### 4. Timeout na automação
- Aumentar `AUTOMATION_TIMEOUT` no arquivo de configuração
- Verificar velocidade da internet
- Verificar se o HikCentral está lento

### Debug e Logs

#### Screenshots Automáticos
- `login_debug.png` - Tela de login para debug
- `login_error.png` - Erro durante login
- `debug_page.png` - Página atual para análise

#### Logs Detalhados
```bash
# Ver logs em tempo real
tail -f hikcentral_automation.log

# Filtrar por visitante específico
grep "visitante_ID" hikcentral_automation.log
```

## 🔧 Manutenção

### Atualizações
1. **Backup** dos arquivos de configuração
2. **Parar** o servidor de automação
3. **Atualizar** código e dependências
4. **Testar** com visitante de teste
5. **Reiniciar** servidor

### Limpeza
```bash
# Limpar logs antigos
find . -name "*.log" -mtime +30 -delete

# Limpar screenshots de debug
find . -name "*debug*.png" -mtime +7 -delete

# Limpar ambiente virtual (se necessário)
rm -rf venv
python3 -m venv venv
```

## 📱 Integração com Frontend

### Componente de Status

```tsx
import { useHikCentralStatus } from '../hooks/useHikCentralStatus';

function VisitorStatus({ visitorId }: { visitorId: string }) {
  const { status, isLoading, error } = useHikCentralStatus(visitorId);
  
  if (isLoading) return <div>Verificando status...</div>;
  if (error) return <div>Erro: {error}</div>;
  
  return (
    <div>
      <h3>Status HikCentral</h3>
      <p>Status: {status}</p>
    </div>
  );
}
```

### Hook Personalizado

```tsx
export function useHikCentralStatus(visitorId: string) {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/hikcentral/status/${visitorId}`);
        const data = await response.json();
        setStatus(data.status);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Verificar a cada 5s
    
    return () => clearInterval(interval);
  }, [visitorId]);

  return { status, isLoading, error };
}
```

## 🎉 Próximos Passos

1. **Testar** com visitantes reais
2. **Monitorar** logs e performance
3. **Ajustar** timeouts e retries conforme necessário
4. **Implementar** notificações em tempo real
5. **Adicionar** dashboard de monitoramento
6. **Configurar** alertas para falhas

## 📞 Suporte

Para dúvidas ou problemas:

1. **Verificar logs** primeiro
2. **Consultar** este README
3. **Verificar** status da API de automação
4. **Testar** com dados de exemplo
5. **Contatar** equipe de desenvolvimento

---

**🎯 Sistema funcionando perfeitamente!** Agora os visitantes são cadastrados automaticamente no HikCentral sem intervenção manual! 🚀 
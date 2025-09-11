# 🏢 HikCentral Automation - Sistema de Automação para Portaria

Sistema automatizado para gerenciamento de visitantes no HikCentral Professional, desenvolvido para condomínios e empresas que utilizam o sistema de controle de acesso da Hikvision.

## 🚀 Funcionalidades

- **Automação Completa**: Preenchimento automático de formulários de visitantes
- **Integração HikCentral**: Conecta diretamente com a interface web do HikCentral
- **Modo Visível**: Execução com interface gráfica para debug e monitoramento
- **Delays Humanos**: Simula comportamento humano para evitar detecção anti-bot
- **Tratamento de Erros**: Sistema robusto com retry automático
- **Logs Detalhados**: Monitoramento completo de todas as operações

## 🛠️ Tecnologias

- **Python 3.8+**: Linguagem principal
- **Selenium WebDriver**: Automação web
- **Chrome/ChromeDriver**: Navegador para automação
- **WebDriver Manager**: Gerenciamento automático de drivers

## 📋 Pré-requisitos

- Python 3.8 ou superior
- Google Chrome instalado
- Acesso ao servidor HikCentral
- Credenciais de administrador

## ⚙️ Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/hikcentral-automation.git
cd hikcentral-automation
```

### 2. Crie um ambiente virtual
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

## 🔧 Configuração

### 1. Arquivo de configuração
Crie um arquivo `.env` na raiz do projeto:
```env
HIKCENTRAL_URL=http://seu-servidor:porta
HIKCENTRAL_USERNAME=admin
HIKCENTRAL_PASSWORD=sua_senha
DEBUG_MODE=true
HEADLESS_MODE=false
```

### 2. Configuração do HikCentral
- Acesse o servidor HikCentral
- Configure usuários e permissões
- Teste o acesso via navegador

## 🚀 Uso

### Execução Básica
```bash
python test_real_hikcentral_visible_debug.py
```

### Execução com Configurações Personalizadas
```bash
python -c "
from hikcentral_automation import HikCentralAutomation
automation = HikCentralAutomation(
    headless=False,
    simulation_mode=False,
    debug_mode=True
)
automation.run_visitor_registration(visitor_data)
"
```

## 📁 Estrutura do Projeto

```
hikcentral-automation/
├── 📄 README.md                           # Este arquivo
├── 📄 requirements.txt                     # Dependências Python
├── 📄 .gitignore                          # Arquivos ignorados pelo Git
├── 🐍 hikcentral_automation.py            # Módulo principal de automação
├── 🧪 test_real_hikcentral_visible_debug.py  # Script de teste principal
├── 📁 config/                             # Configurações
├── 📁 logs/                               # Logs de execução
├── 📁 screenshots/                        # Capturas de tela para debug
└── 📁 docs/                               # Documentação adicional
```

## 🔍 Debug e Monitoramento

### Modo Debug
```python
# Ativar logs detalhados
import logging
logging.basicConfig(level=logging.DEBUG)

# Executar com interface visível
automation = HikCentralAutomation(headless=False, debug_mode=True)
```

### Logs
- **Console**: Logs em tempo real durante execução
- **Arquivo**: Logs salvos em `logs/automation.log`
- **Screenshots**: Capturas automáticas em caso de erro

## 🚨 Tratamento de Erros

O sistema inclui tratamento robusto para:
- **Elementos não encontrados**: Retry automático com seletores alternativos
- **Timeouts**: Aguarda carregamento de páginas
- **Message boxes**: Fecha automaticamente popups
- **Tooltips**: Remove overlays que impedem interação

## 🔒 Segurança

- **Credenciais**: Nunca commitadas no código
- **HTTPS**: Suporte para conexões seguras
- **Validação**: Verificação de dados de entrada
- **Logs**: Sem informações sensíveis

## 🧪 Testes

### Executar Testes
```bash
# Testes unitários
pytest tests/

# Testes de integração
pytest tests/integration/

# Testes com relatório HTML
pytest --html=report.html
```

### Cobertura de Testes
```bash
pytest --cov=hikcentral_automation --cov-report=html
```

## 📊 Monitoramento

### Métricas Coletadas
- **Taxa de Sucesso**: Visitas registradas com sucesso
- **Tempo de Execução**: Duração de cada operação
- **Erros**: Tipos e frequência de falhas
- **Performance**: Tempo de resposta do sistema

## 🤝 Contribuição

### Como Contribuir
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código
- **Black**: Formatação automática
- **Flake8**: Linting e qualidade
- **Type Hints**: Tipagem estática
- **Docstrings**: Documentação de funções

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

### Problemas Comuns
- **ChromeDriver não encontrado**: Execute `webdriver-manager update`
- **Elementos não encontrados**: Verifique seletores CSS/XPath
- **Timeouts**: Aumente valores de espera no código

### Contato
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/hikcentral-automation/issues)
- **Discussions**: [GitHub Discussions](https://github.com/seu-usuario/hikcentral-automation/discussions)
- **Email**: seu-email@exemplo.com

## 🎯 Roadmap

- [ ] **Interface Web**: Dashboard para gerenciamento
- [ ] **API REST**: Endpoints para integração
- [ ] **Banco de Dados**: Persistência de dados
- [ ] **Relatórios**: Estatísticas e análises
- [ ] **Multi-tenant**: Suporte a múltiplos clientes
- [ ] **Mobile App**: Aplicativo móvel

## 🙏 Agradecimentos

- **Hikvision**: Pelo sistema HikCentral
- **Selenium**: Pelo framework de automação
- **Comunidade Python**: Pelo suporte e bibliotecas

---

⭐ **Se este projeto te ajudou, considere dar uma estrela!**
# Force deploy Thu Sep 11 12:14:26 -03 2025
# Force deploy build fix Thu Sep 11 16:16:22 -03 2025

# Visit Hub Backend

Backend para sistema de gestão de visitantes de condomínio com integração Hikvision.

## Funcionalidades

- ✅ Autenticação JWT com múltiplos perfis (morador/admin)
- ✅ Sistema de links de convite únicos para visitantes
- ✅ Upload seguro de selfies e documentos (Supabase Storage)
- ✅ Integração completa com API Hikvision
- ✅ Gestão automática de validade de acessos
- ✅ Sistema de notificações push
- ✅ Compliance LGPD com consentimento e retenção de dados
- ✅ Painel administrativo completo
- ✅ Logs detalhados de segurança e auditoria
- ✅ Rate limiting e middlewares de segurança
- ✅ Jobs automáticos de limpeza e manutenção

## Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Linguagem tipada
- **Express.js** - Framework web
- **Supabase** - Banco de dados PostgreSQL e Storage
- **JWT** - Autenticação baseada em tokens
- **Bcrypt** - Hash de senhas
- **Sharp** - Processamento de imagens
- **Winston** - Sistema de logs
- **Node-cron** - Agendamento de tarefas
- **Zod** - Validação de schemas

## Estrutura do Projeto

```
backend/
├── src/
│   ├── config/           # Configurações da aplicação
│   ├── controllers/      # Controladores (não utilizados - lógica nas rotas)
│   ├── middlewares/      # Middlewares customizados
│   ├── routes/           # Definição das rotas da API
│   ├── services/         # Serviços de negócio
│   ├── types/            # Definições de tipos TypeScript
│   ├── utils/            # Utilitários e validações
│   ├── app.ts            # Inicialização da aplicação
│   └── server.ts         # Configuração do servidor Express
├── database/             # Scripts SQL para o banco
├── package.json          # Dependências e scripts
├── tsconfig.json         # Configuração TypeScript
└── env.example           # Exemplo de variáveis de ambiente
```

## Configuração

### 1. Dependências

```bash
npm install
```

### 2. Variáveis de Ambiente

Copie o arquivo `env.example` para `.env` e configure:

```env
# Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=seu-jwt-secret-super-seguro
JWT_EXPIRES_IN=24h

# Supabase
SUPABASE_URL=https://rnpgtwughapxxvvckepd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
SUPABASE_ANON_KEY=sua-chave-anonima

# Hikvision
HIKVISION_BASE_URL=http://192.168.1.100
HIKVISION_USERNAME=admin
HIKVISION_PASSWORD=sua-senha-hikvision
HIKVISION_DEVICE_INDEX=1

# Outros...
```

### 3. Banco de Dados

Execute os scripts SQL no Supabase na ordem:

1. `database/01_initial_schema.sql` - Cria tabelas e estrutura
2. `database/02_rls_policies.sql` - Configura políticas de segurança
3. `database/03_initial_data.sql` - Insere dados iniciais

### 4. Configuração do Supabase Storage

No painel do Supabase, configure:

1. Bucket `visitantes-uploads` (privado)
2. Políticas RLS para controle de acesso
3. Configurar CORS se necessário

## Execução

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

### Testes

```bash
npm test
```

## API Endpoints

### Autenticação (`/api/auth`)

- `POST /login` - Login de usuário
- `POST /logout` - Logout
- `GET /me` - Dados do usuário autenticado
- `PUT /me` - Atualizar dados do usuário
- `PUT /change-password` - Alterar senha
- `POST /users` - Criar usuário (admin)
- `GET /users` - Listar usuários (admin)

### Visitantes (`/api/visitantes`)

- `POST /links` - Criar link de convite (morador)
- `GET /links` - Listar links do morador
- `DELETE /links/:id` - Cancelar link
- `GET /` - Listar visitantes do morador
- `GET /:id` - Detalhes de um visitante
- `GET /:id/logs` - Logs de acesso do visitante
- `PUT /:id/liberar` - Liberar visitante
- `PUT /:id/cancelar` - Cancelar visitante
- `POST /:id/selfie` - Upload de selfie
- `POST /:id/documento` - Upload de documento

### Público (`/api/public`)

- `GET /convite/:token` - Validar token de convite
- `POST /convite/:token/visitante` - Cadastrar visitante com token
- `POST /visitante/:id/selfie` - Upload de selfie (público)
- `POST /visitante/:id/documento` - Upload de documento (público)
- `GET /visitante/:id/status` - Status do visitante
- `GET /configuracoes` - Configurações públicas

### Admin (`/api/admin`)

- `GET /dashboard` - Estatísticas do sistema
- `GET /visitantes` - Listar todos os visitantes
- `GET /logs-acesso` - Logs de acesso completos
- `POST /sync-hikvision` - Sincronizar com Hikvision
- `POST /cleanup` - Executar limpeza
- `GET /configuracoes` - Listar configurações
- `PUT /configuracoes/:chave` - Atualizar configuração
- `POST /notificacao` - Enviar notificação em lote
- `POST /expirar-visitantes` - Forçar expiração
- `GET /relatorios/acessos` - Relatório de acessos

## Integração Hikvision

O sistema integra com equipamentos Hikvision através da API REST oficial:

### Funcionalidades

- Criação automática de usuários
- Upload de dados biométricos (face)
- Controle de validade de acesso
- Remoção automática ao expirar
- Sincronização de logs de acesso

### Configuração

1. Configure IP, usuário e senha do equipamento
2. Habilite API REST no equipamento
3. Configure permissões adequadas para o usuário
4. Teste conectividade com `/api/admin/sync-hikvision`

## Segurança

### Implementada

- Rate limiting por IP
- Validação de entrada com Zod
- Sanitização de dados
- Headers de segurança (Helmet)
- CORS configurável
- Detecção de atividades suspeitas
- Logs de segurança detalhados
- RLS (Row Level Security) no Supabase
- Tokens JWT com expiração
- Hash de senhas com bcrypt

### Políticas RLS

- Usuários só veem seus próprios dados
- Moradores só veem visitantes de sua unidade
- Admins têm acesso completo
- Visitantes usam tokens temporários

## Compliance LGPD

### Implementado

- Consentimento explícito do visitante
- Retenção configurável de dados
- Remoção automática após expiração
- Logs de acesso aos dados pessoais
- URLs assinadas para arquivos sensíveis
- Função de "esquecimento" (remoção completa)

### Configurações

- `LGPD_RETENTION_DAYS` - Dias de retenção (padrão: 365)
- Job automático de limpeza diária
- Função `limpar_dados_expirados()` no banco

## Monitoramento

### Logs

- Todos os logs são estruturados (JSON)
- Níveis configuráveis (debug, info, warn, error)
- Rotação automática de arquivos
- Logs de segurança separados

### Métricas

- Dashboard administrativo com estatísticas
- Contadores de visitantes por status
- Logs de acesso por período
- Uso de storage
- Status da integração Hikvision

## Jobs Automáticos

### Executados

1. **Verificação de expirados** (a cada hora)
   - Busca visitantes com validade expirada
   - Remove do Hikvision
   - Atualiza status no banco

2. **Limpeza de dados** (diário às 2h)
   - Remove dados antigos conforme LGPD
   - Limpa arquivos órfãos do storage
   - Remove notificações antigas

3. **Notificações de expiração** (diário às 8h)
   - Notifica moradores sobre visitantes expirando
   - Envia 24h antes do vencimento

## Desenvolvimento

### Scripts

- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm run start` - Executar build de produção
- `npm run lint` - Verificar código
- `npm run lint:fix` - Corrigir problemas automáticos

### Estrutura de Commits

Use conventional commits:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão Hikvision**
   - Verificar IP e credenciais
   - Confirmar que API REST está habilitada
   - Testar conectividade de rede

2. **Erro no upload de arquivos**
   - Verificar configuração do Supabase Storage
   - Confirmar políticas RLS
   - Verificar tamanho máximo configurado

3. **Token JWT inválido**
   - Verificar `JWT_SECRET`
   - Confirmar sincronização de relógio
   - Verificar expiração configurada

4. **Erro de permissão no banco**
   - Verificar `SUPABASE_SERVICE_ROLE_KEY`
   - Confirmar políticas RLS
   - Verificar se tabelas existem

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para detalhes.

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs da aplicação
2. Consulte a documentação da API
3. Abra uma issue no repositório
4. Entre em contato com a equipe de desenvolvimento

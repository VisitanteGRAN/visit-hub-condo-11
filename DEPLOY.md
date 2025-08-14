# 🚀 Guia de Deploy - Visit Hub Condo

## 📋 Pré-requisitos

1. **Conta no Vercel** - https://vercel.com
2. **Projeto Supabase configurado** - `rnpgtwughapxxvvckepd`
3. **Banco de dados configurado** com os SQLs executados

## 🔧 Configuração do Banco Supabase

### 1. Execute os SQLs no painel do Supabase:
- Acesse: https://supabase.com/dashboard/project/rnpgtwughapxxvvckepd
- Vá em **SQL Editor**
- Execute em ordem:
  - `backend/database/01_initial_schema.sql`
  - `backend/database/02_rls_policies.sql`
  - `backend/database/03_initial_data.sql`

### 2. Obtenha as chaves do Supabase:
- Vá em **Settings** → **API**
- Copie a **Service Role Key**
- A **Anon Key** já está configurada

## 🌐 Deploy no Vercel

### 1. Conecte o repositório:
```bash
# Instale o Vercel CLI
npm i -g vercel

# Faça login
vercel login

# Deploy
vercel
```

### 2. Configure as variáveis de ambiente no Vercel:
No painel do Vercel, vá em **Settings** → **Environment Variables** e adicione:

```
SUPABASE_URL=https://rnpgtwughapxxvvckepd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzM1MzksImV4cCI6MjA3MDYwOTUzOX0.rlPAA5La3_xBKchaSXs8JZZ1IhjCkfBmzTwylLe25eE
JWT_SECRET=seu-jwt-secret-super-seguro-mude-em-producao
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://seu-dominio-vercel.vercel.app
NODE_ENV=production
```

### 3. URLs do projeto:
- **Frontend:** `https://seu-dominio-vercel.vercel.app`
- **API:** `https://seu-dominio-vercel.vercel.app/api`

## 🔄 Atualizações

Para atualizar o projeto:
```bash
vercel --prod
```

## 📱 Funcionalidades

✅ **Frontend:** React + Vite + Tailwind CSS
✅ **Backend:** Express.js como API routes
✅ **Banco:** Supabase (PostgreSQL)
✅ **Autenticação:** JWT + Supabase Auth
✅ **Upload:** Supabase Storage
✅ **Notificações:** Sistema integrado

## 🛠️ Desenvolvimento Local

```bash
# Frontend
npm run dev

# Backend (em outro terminal)
cd backend && npm run dev
```

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- [Documentação do Vercel](https://vercel.com/docs)
- [Documentação do Supabase](https://supabase.com/docs) 
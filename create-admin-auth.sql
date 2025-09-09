-- Script para criar usuário admin no Supabase Auth
-- Execute no SQL Editor do Supabase

-- Criar usuário admin no sistema de autenticação
SELECT auth.signup(
    'admin@condominio.com.br',
    'Admin@VisitHub2024!',
    '{}',
    '{
        "nome": "Administrador do Sistema",
        "perfil": "admin"
    }'::jsonb
);

-- Confirmar o email automaticamente (opcional)
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'admin@condominio.com.br';

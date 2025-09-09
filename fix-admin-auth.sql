-- Script para corrigir autenticação do admin
-- Execute no SQL Editor do Supabase

-- 1. Deletar usuário se existir (para recriar limpo)
DELETE FROM auth.users WHERE email = 'admingran1@condominio.com';

-- 2. Criar usuário no sistema de autenticação com ID fixo
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admingran1@condominio.com',
    crypt('Admin@GranRoyalle2024!', gen_salt('bf')),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"nome": "Administrador Gran Royalle"}',
    NOW(),
    NOW()
);

-- 3. Atualizar/criar na tabela usuarios
INSERT INTO usuarios (
    id,
    email, 
    nome,
    perfil,
    unidade,
    ativo,
    status,
    created_at
) 
SELECT 
    au.id,
    'admingran1@condominio.com',
    'Administrador Gran Royalle',
    'admin',
    'ADMINISTRAÇÃO',
    true,
    'ativo',
    NOW()
FROM auth.users au 
WHERE au.email = 'admingran1@condominio.com'
ON CONFLICT (email) DO UPDATE SET
    ativo = true,
    status = 'ativo',
    perfil = 'admin';

-- 4. Verificar se foi criado corretamente
SELECT 
    'AUTH USERS' as tabela,
    au.id, 
    au.email, 
    au.confirmed_at, 
    au.email_confirmed_at
FROM auth.users au
WHERE au.email = 'admingran1@condominio.com'

UNION ALL

SELECT 
    'USUARIOS' as tabela,
    u.id, 
    u.email, 
    u.created_at::text, 
    u.status
FROM usuarios u 
WHERE u.email = 'admingran1@condominio.com';

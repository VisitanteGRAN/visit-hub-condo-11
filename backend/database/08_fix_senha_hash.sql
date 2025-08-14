-- CORRIGIR COLUNA SENHA_HASH
-- Execute este script no Supabase Dashboard

-- 1. Primeiro, vamos permitir que senha_hash seja NULL
ALTER TABLE usuarios ALTER COLUMN senha_hash DROP NOT NULL;

-- 2. Agora vamos inserir o usuário admin sem senha_hash
INSERT INTO usuarios (
    id,
    nome,
    email,
    perfil,
    unidade,
    ativo,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Administrador Teste',
    'admin@teste.com',
    'admin',
    'ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. Verificar se foi criado
SELECT * FROM usuarios WHERE email = 'admin@teste.com';

-- 4. Agora você pode criar o usuário no Supabase Auth:
-- - Vá em Authentication > Users
-- - Clique em "Add User"
-- - Email: admin@teste.com
-- - Senha: Admin123#
-- - Marque "Email confirmed" 
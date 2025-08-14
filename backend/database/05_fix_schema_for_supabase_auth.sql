-- Corrigir schema para funcionar com Supabase Auth
-- Execute este script após corrigir as políticas RLS

-- 1. Primeiro, vamos alterar a tabela usuarios para funcionar com Supabase Auth
ALTER TABLE usuarios 
    ALTER COLUMN senha_hash DROP NOT NULL,
    ALTER COLUMN id SET DATA TYPE TEXT,
    ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 2. Remover a constraint UNIQUE do email (Supabase Auth já cuida disso)
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;

-- 3. Adicionar coluna para sincronizar com Supabase Auth
ALTER TABLE usuarios 
    ADD COLUMN IF NOT EXISTS supabase_user_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_supabase_id ON usuarios(supabase_user_id);

-- 5. Agora vamos inserir o usuário admin corretamente
INSERT INTO usuarios (
    id,
    nome,
    email,
    perfil,
    unidade,
    ativo,
    supabase_user_id,
    email_verified,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid()::text,
    'Administrador Teste',
    'admin@teste.com',
    'admin',
    'ADMIN',
    true,
    'admin-test-001', -- ID temporário para Supabase Auth
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 6. Verificar se foi inserido
SELECT * FROM usuarios WHERE perfil = 'admin';

-- 7. Agora você precisa criar o usuário no Supabase Auth:
-- - Vá em Authentication > Users no painel do Supabase
-- - Clique em "Add User"
-- - Email: admin@teste.com
-- - Senha: (defina uma senha forte)
-- - Marque "Email confirmed"
-- - Depois atualize o supabase_user_id na tabela usuarios 
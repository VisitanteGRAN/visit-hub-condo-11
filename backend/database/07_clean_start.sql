-- LIMPAR TUDO E COMEÇAR DO ZERO
-- Execute este script no Supabase Dashboard

-- 1. Desabilitar RLS em todas as tabelas
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE links_convite DISABLE ROW LEVEL SECURITY;
ALTER TABLE visitantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas (se existirem)
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_auth" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_auth" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_admin" ON usuarios;

DROP POLICY IF EXISTS "links_convite_select_all" ON links_convite;
DROP POLICY IF EXISTS "links_convite_insert_auth" ON links_convite;
DROP POLICY IF EXISTS "links_convite_update_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_delete_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_select_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_insert_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_update_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_delete_own" ON links_convite;

DROP POLICY IF EXISTS "visitantes_select_all" ON visitantes;
DROP POLICY IF EXISTS "visitantes_insert_auth" ON visitantes;
DROP POLICY IF EXISTS "visitantes_update_own" ON visitantes;
DROP POLICY IF EXISTS "visitantes_delete_own" ON visitantes;
DROP POLICY IF EXISTS "visitantes_select_policy" ON visitantes;
DROP POLICY IF EXISTS "visitantes_insert_policy" ON visitantes;
DROP POLICY IF EXISTS "visitantes_update_policy" ON visitantes;
DROP POLICY IF EXISTS "visitantes_delete_policy" ON visitantes;

DROP POLICY IF EXISTS "logs_acesso_select_all" ON logs_acesso;
DROP POLICY IF EXISTS "logs_acesso_insert_auth" ON logs_acesso;

DROP POLICY IF EXISTS "configuracoes_select_all" ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_insert_auth" ON configuracoes;

DROP POLICY IF EXISTS "notificacoes_select_all" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_insert_auth" ON notificacoes;

-- 3. Agora vamos criar um usuário admin simples
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

-- 4. Verificar se foi criado
SELECT * FROM usuarios WHERE email = 'admin@teste.com';

-- 5. Agora você pode criar o usuário no Supabase Auth:
-- - Vá em Authentication > Users
-- - Clique em "Add User"
-- - Email: admin@teste.com
-- - Senha: Admin123#
-- - Marque "Email confirmed" 
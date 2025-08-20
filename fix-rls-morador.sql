-- Fix para RLS e usuário morador@condominio.com.br
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro vamos verificar o usuário atual
SELECT 
    id, 
    nome, 
    email, 
    perfil, 
    unidade,
    supabase_user_id,
    ativo
FROM usuarios 
WHERE email = 'morador@condominio.com.br';

-- 2. Verificar os usuários do Supabase Auth
SELECT 
    auth.users.id as auth_id,
    auth.users.email,
    usuarios.id as user_table_id,
    usuarios.nome,
    usuarios.supabase_user_id
FROM auth.users 
LEFT JOIN usuarios ON auth.users.id::text = usuarios.supabase_user_id::text
WHERE auth.users.email IN ('morador@condominio.com.br', 'lacerdalucca6@gmail.com');

-- 3. Atualizar o supabase_user_id do morador com o ID correto do Auth
-- (Execute apenas se o supabase_user_id estiver NULL ou incorreto)
UPDATE usuarios 
SET supabase_user_id = (
    SELECT auth.users.id::text 
    FROM auth.users 
    WHERE auth.users.email = 'morador@condominio.com.br'
    LIMIT 1
)
WHERE email = 'morador@condominio.com.br' 
AND (supabase_user_id IS NULL OR supabase_user_id != (
    SELECT auth.users.id::text 
    FROM auth.users 
    WHERE auth.users.email = 'morador@condominio.com.br'
    LIMIT 1
));

-- 4. Criar o usuário morador se não existir
INSERT INTO usuarios (
    id,
    nome,
    email,
    perfil,
    unidade,
    ativo,
    supabase_user_id,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Morador Teste',
    'morador@condominio.com.br',
    'morador',
    '101',
    true,
    auth.users.id::text,
    NOW(),
    NOW()
FROM auth.users 
WHERE auth.users.email = 'morador@condominio.com.br'
AND NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'morador@condominio.com.br'
);

-- 5. Aplicar políticas RLS mais permissivas para resolver o problema
-- Desabilitar RLS temporariamente
ALTER TABLE links_convite DISABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "links_convite_select_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_insert_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_update_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_delete_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_select_all" ON links_convite;
DROP POLICY IF EXISTS "links_convite_insert_auth" ON links_convite;

-- Criar políticas mais permissivas
CREATE POLICY "links_convite_select_all" ON links_convite
    FOR SELECT USING (true);

CREATE POLICY "links_convite_insert_auth" ON links_convite
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.supabase_user_id::text = auth.uid()::text
            AND u.ativo = true
        )
    );

CREATE POLICY "links_convite_update_auth" ON links_convite
    FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND (
            morador_id::text = (
                SELECT u.id::text FROM usuarios u 
                WHERE u.supabase_user_id::text = auth.uid()::text
            )
            OR EXISTS (
                SELECT 1 FROM usuarios u 
                WHERE u.supabase_user_id::text = auth.uid()::text 
                AND u.perfil = 'admin'
            )
        )
    );

CREATE POLICY "links_convite_delete_auth" ON links_convite
    FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND (
            morador_id::text = (
                SELECT u.id::text FROM usuarios u 
                WHERE u.supabase_user_id::text = auth.uid()::text
            )
            OR EXISTS (
                SELECT 1 FROM usuarios u 
                WHERE u.supabase_user_id::text = auth.uid()::text 
                AND u.perfil = 'admin'
            )
        )
    );

-- Reabilitar RLS
ALTER TABLE links_convite ENABLE ROW LEVEL SECURITY;

-- 6. Verificar se tudo está funcionando
SELECT 
    'TESTE - Usuários encontrados:' as status,
    COUNT(*) as total
FROM usuarios 
WHERE email IN ('morador@condominio.com.br', 'lacerdalucca6@gmail.com');

-- 7. Verificar políticas aplicadas
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'links_convite'
ORDER BY policyname; 
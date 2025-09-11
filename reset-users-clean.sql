-- Script para limpar e resetar usuários
-- Execute no SQL Editor do Supabase

-- 1. Deletar todos os moradores da tabela usuarios (manter só admin)
DELETE FROM usuarios 
WHERE perfil = 'morador';

-- 2. Deletar moradores do Supabase Auth (manter só admin)
DELETE FROM auth.users 
WHERE email NOT LIKE '%admin%' 
AND email NOT LIKE '%test@admin.com%';

-- 3. Verificar o que sobrou
SELECT 'USUARIOS' as tabela, email, nome, perfil, ativo, status 
FROM usuarios
UNION ALL
SELECT 'AUTH', email, 'N/A', 'N/A', 'N/A', email_confirmed_at::text
FROM auth.users
ORDER BY tabela, email;

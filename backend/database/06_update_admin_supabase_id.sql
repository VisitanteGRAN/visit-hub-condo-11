-- Atualizar o supabase_user_id do usuário admin
-- Execute este script DEPOIS de criar o usuário no Supabase Auth

-- 1. Primeiro, vamos ver qual é o ID real do usuário no Supabase Auth
-- Vá em Authentication > Users e copie o ID do usuário admin@teste.com

-- 2. Depois execute este comando (substitua o ID real):
UPDATE usuarios 
SET supabase_user_id = 'SUBSTITUA_PELO_ID_REAL_DO_SUPABASE_AUTH'
WHERE email = 'admin@teste.com';

-- 3. Verificar se foi atualizado
SELECT id, nome, email, perfil, supabase_user_id FROM usuarios WHERE email = 'admin@teste.com';

-- 4. Agora você pode fazer login com:
-- Email: admin@teste.com
-- Senha: Admin123# (ou a que você definiu)
-- Role: admin 
-- SCRIPT PARA CORRIGIR USUÁRIOS APROVADOS VIA PAINEL QUE NÃO CONSEGUEM LOGAR
-- Este script cria usuários na tabela auth.users para todos os moradores aprovados

-- 1. Verificar usuários aprovados na tabela usuarios que não estão em auth.users
SELECT 
  u.email,
  u.nome,
  u.ativo,
  u.status,
  CASE 
    WHEN au.email IS NULL THEN 'NÃO EXISTE EM AUTH.USERS'
    ELSE 'EXISTE EM AUTH.USERS'
  END as auth_status
FROM usuarios u
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.perfil = 'morador' 
  AND u.ativo = true 
  AND u.status = 'ativo';

-- 2. Ver quantos moradores aprovados existem sem conta auth
SELECT COUNT(*) as moradores_sem_auth
FROM usuarios u
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.perfil = 'morador' 
  AND u.ativo = true 
  AND u.status = 'ativo'
  AND au.email IS NULL;

-- 3. IMPORTANTE: Para criar usuários em auth.users, você deve usar o Supabase Dashboard:
-- Supabase Dashboard > Authentication > Users > Add User
-- 
-- OU usar a API do Supabase (não SQL direto):
-- 
-- Para cada usuário que precisa ser criado:
-- 1. Email: email_do_usuario@exemplo.com
-- 2. Password: senha_temporaria_123
-- 3. Auto Confirm User: MARCAR (importante!)
-- 4. Send confirmation email: DESMARCAR
--
-- Depois o usuário pode trocar a senha via "Esqueci minha senha"

-- 4. Script alternativo - Atualizar TODOS os moradores para status pendente
-- e pedir para eles se cadastrarem novamente (mais simples):

-- UPDATE usuarios 
-- SET ativo = false, status = 'pendente'
-- WHERE perfil = 'morador';

-- DEBUG: VERIFICAR IDs DE USUÁRIOS E PROBLEMA DE APROVAÇÃO

-- 1. Ver todos os usuários pendentes com seus IDs reais
SELECT 
  id,
  email,
  nome,
  ativo,
  status,
  created_at
FROM usuarios 
WHERE perfil = 'morador' 
  AND (ativo = false OR status = 'pendente')
ORDER BY created_at DESC;

-- 2. Verificar se o ID específico existe
SELECT * FROM usuarios WHERE id = '094be8e7-f9bd-4540-b640-4215a7000383';

-- 3. Ver dados do usuário lacerdalucca4@gmail.com
SELECT 
  id,
  email,
  nome,
  ativo,
  status
FROM usuarios 
WHERE email = 'lacerdalucca4@gmail.com';

-- 4. APROVAR TODOS OS MORADORES PENDENTES (SOLUÇÃO RÁPIDA)
UPDATE usuarios 
SET ativo = true, status = 'ativo' 
WHERE perfil = 'morador' 
  AND (ativo = false OR status = 'pendente');

-- 5. Verificar se a aprovação funcionou
SELECT 
  email,
  nome,
  ativo,
  status
FROM usuarios 
WHERE perfil = 'morador'
ORDER BY email;

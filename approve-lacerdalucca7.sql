-- APROVAR USUÁRIO lacerdalucca7@gmail.com IMEDIATAMENTE

-- 1. Verificar dados atuais
SELECT id, email, nome, ativo, status 
FROM usuarios 
WHERE email = 'lacerdalucca7@gmail.com';

-- 2. Aprovar usuário
UPDATE usuarios 
SET ativo = true, status = 'ativo' 
WHERE email = 'lacerdalucca7@gmail.com';

-- 3. Verificar se foi aprovado
SELECT id, email, nome, ativo, status 
FROM usuarios 
WHERE email = 'lacerdalucca7@gmail.com';

-- 4. Ver todos os usuários pendentes
SELECT id, email, nome, ativo, status 
FROM usuarios 
WHERE perfil = 'morador' AND (ativo = false OR status = 'pendente');

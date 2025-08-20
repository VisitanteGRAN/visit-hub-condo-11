-- Script para verificar usuários existentes
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Verificar usuários existentes
SELECT id, email, nome, perfil, unidade, ativo 
FROM usuarios 
WHERE email IN ('admin@condominio.com.br', 'morador@condominio.com.br')
ORDER BY email;

-- 2. Se não aparecer nenhum resultado, verificar todos os usuários
SELECT id, email, nome, perfil, unidade, ativo 
FROM usuarios 
ORDER BY email;

-- 3. Adicionar colunas CPF e telefone se necessário
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);

-- 4. Atualizar usuários existentes com CPF (se existirem)
UPDATE usuarios 
SET cpf = '00000000191', telefone = '(11) 0000-0000'
WHERE email = 'admin@condominio.com.br';

UPDATE usuarios 
SET cpf = '12345678901', telefone = '(11) 99999-9999'
WHERE email = 'morador@condominio.com.br';

-- 5. Verificar resultado final
SELECT id, email, nome, perfil, unidade, ativo, cpf, telefone
FROM usuarios 
WHERE email IN ('admin@condominio.com.br', 'morador@condominio.com.br')
ORDER BY email; 
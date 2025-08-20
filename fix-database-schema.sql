-- Script para corrigir estrutura da tabela usuarios
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- 2. Adicionar coluna CPF se não existir
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);

-- 3. Adicionar coluna telefone se não existir  
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);

-- 4. Verificar estrutura após mudanças
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- 5. Agora inserir os usuários de teste
INSERT INTO usuarios (
  id,
  email,
  senha_hash,
  nome,
  perfil,
  unidade,
  ativo,
  cpf,
  telefone
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@condominio.com.br',
  '',
  'Administrador Sistema',
  'admin',
  'Administração',
  true,
  '00000000191',
  '(11) 0000-0000'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nome = EXCLUDED.nome,
  perfil = EXCLUDED.perfil,
  unidade = EXCLUDED.unidade,
  ativo = EXCLUDED.ativo,
  cpf = EXCLUDED.cpf,
  telefone = EXCLUDED.telefone;

-- 6. Inserir usuário morador
INSERT INTO usuarios (
  id,
  email,
  senha_hash,
  nome,
  perfil,
  unidade,
  ativo,
  cpf,
  telefone
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'morador@condominio.com.br',
  '',
  'Morador Teste',
  'morador',
  'Apto 101',
  true,
  '12345678901',
  '(11) 99999-9999'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nome = EXCLUDED.nome,
  perfil = EXCLUDED.perfil,
  unidade = EXCLUDED.unidade,
  ativo = EXCLUDED.ativo,
  cpf = EXCLUDED.cpf,
  telefone = EXCLUDED.telefone;

-- 7. Verificar se foram criados
SELECT id, email, nome, perfil, unidade, ativo, cpf, telefone
FROM usuarios 
WHERE email IN ('admin@condominio.com.br', 'morador@condominio.com.br'); 
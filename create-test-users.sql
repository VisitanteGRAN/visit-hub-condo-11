-- Script para criar usuários de teste no Supabase
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Criar usuário admin
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
  ativo = EXCLUDED.ativo;

-- 2. Criar usuário morador
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
  ativo = EXCLUDED.ativo;

-- 3. Verificar se foram criados
SELECT id, email, nome, perfil, unidade, ativo 
FROM usuarios 
WHERE email IN ('admin@condominio.com.br', 'morador@condominio.com.br'); 
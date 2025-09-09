-- Script SIMPLES para criar apenas o usuário administrador
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a coluna status existe, se não, criar
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';

-- 2. Criar usuário admin se não existir
INSERT INTO usuarios (
  id,
  email, 
  nome,
  perfil,
  unidade,
  ativo,
  status,
  created_at
) VALUES (
  gen_random_uuid(), -- ID automático
  'admin@condominio.com.br',
  'Administrador do Sistema',
  'admin',
  'ADMINISTRAÇÃO',
  true,
  'ativo',
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  ativo = true,
  status = 'ativo',
  perfil = 'admin';

-- 3. Verificar se foi criado
SELECT id, email, nome, perfil, ativo, status 
FROM usuarios 
WHERE email = 'admin@condominio.com.br';

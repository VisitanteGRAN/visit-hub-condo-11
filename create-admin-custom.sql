-- Criar admin com email personalizado
-- Execute no SQL Editor do Supabase

-- Primeiro, atualizar/criar na tabela usuarios
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
  gen_random_uuid(),
  'admingran1@condominio.com',
  'Administrador Gran Royalle',
  'admin',
  'ADMINISTRAÇÃO',
  true,
  'ativo',
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  ativo = true,
  status = 'ativo',
  perfil = 'admin';

-- Verificar se foi criado
SELECT id, email, nome, perfil, ativo, status 
FROM usuarios 
WHERE email = 'admingran1@condominio.com';

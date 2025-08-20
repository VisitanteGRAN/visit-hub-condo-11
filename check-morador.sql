-- VERIFICAR E CRIAR USUÁRIO MORADOR SE NECESSÁRIO
-- Execute no SQL Editor do Supabase Dashboard

-- ========================================
-- 1. VERIFICAR TODOS OS USUÁRIOS
-- ========================================

SELECT id, email, nome, perfil, unidade, ativo 
FROM usuarios 
ORDER BY email;

-- ========================================
-- 2. PROCURAR ESPECIFICAMENTE O MORADOR
-- ========================================

SELECT id, email, nome, perfil, unidade, ativo 
FROM usuarios 
WHERE email LIKE '%morador%' OR perfil = 'morador';

-- ========================================
-- 3. SE NÃO EXISTIR, CRIAR O MORADOR
-- ========================================

-- Inserir morador apenas se não existir
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
) 
SELECT 
  gen_random_uuid(),
  'morador@condominio.com.br',
  '$2b$10$sample.hash.for.morador',
  'Morador Teste',
  'morador',
  'Apto 101',
  true,
  '12345678901',
  '(11) 99999-9999'
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'morador@condominio.com.br'
);

-- ========================================
-- 4. MOSTRAR AMBOS OS USUÁRIOS FINAIS
-- ========================================

SELECT 
  email,
  id as uuid_real,
  nome,
  perfil,
  CASE 
    WHEN email = 'admin@condominio.com.br' THEN 'UUID do Admin'
    WHEN email = 'morador@condominio.com.br' THEN 'UUID do Morador'
    ELSE 'Outro usuário'
  END as tipo
FROM usuarios 
WHERE email IN ('admin@condominio.com.br', 'morador@condominio.com.br')
OR perfil IN ('admin', 'morador')
ORDER BY email; 
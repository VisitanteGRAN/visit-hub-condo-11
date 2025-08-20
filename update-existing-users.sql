-- SCRIPT PARA ATUALIZAR USUÁRIOS EXISTENTES E CORRIGIR SCHEMA
-- Execute no SQL Editor do Supabase Dashboard

-- ========================================
-- 1. ADICIONAR COLUNAS FALTANTES
-- ========================================

-- Adicionar colunas CPF e telefone se não existirem
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);

-- Adicionar coluna documento na tabela visitantes
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS documento VARCHAR(50);

-- ========================================
-- 2. VER USUÁRIOS EXISTENTES
-- ========================================

SELECT id, email, nome, perfil, unidade, ativo, cpf, telefone
FROM usuarios 
WHERE email IN ('admin@condominio.com.br', 'morador@condominio.com.br')
ORDER BY email;

-- ========================================
-- 3. ATUALIZAR USUÁRIOS EXISTENTES COM CPF/TELEFONE
-- ========================================

-- Atualizar usuário admin com CPF e telefone
UPDATE usuarios 
SET 
  cpf = '00000000191',
  telefone = '(11) 0000-0000',
  nome = COALESCE(nome, 'Administrador Sistema'),
  perfil = COALESCE(perfil, 'admin'),
  unidade = COALESCE(unidade, 'Administração'),
  ativo = COALESCE(ativo, true)
WHERE email = 'admin@condominio.com.br';

-- Atualizar usuário morador com CPF e telefone
UPDATE usuarios 
SET 
  cpf = '12345678901',
  telefone = '(11) 99999-9999',
  nome = COALESCE(nome, 'Morador Teste'),
  perfil = COALESCE(perfil, 'morador'),
  unidade = COALESCE(unidade, 'Apto 101'),
  ativo = COALESCE(ativo, true)
WHERE email = 'morador@condominio.com.br';

-- ========================================
-- 4. VERIFICAR USUÁRIOS APÓS UPDATE
-- ========================================

SELECT id, email, nome, perfil, unidade, ativo, cpf, telefone
FROM usuarios 
WHERE email IN ('admin@condominio.com.br', 'morador@condominio.com.br')
ORDER BY email;

-- ========================================
-- 5. VERIFICAR ESTRUTURAS DAS TABELAS
-- ========================================

-- Ver estrutura da tabela usuarios
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- Ver estrutura da tabela visitantes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'visitantes' 
ORDER BY ordinal_position;

-- ========================================
-- 6. MOSTRAR IDs REAIS PARA ATUALIZAR CÓDIGO
-- ========================================

SELECT 
  'Para atualizar AuthContext.tsx:' as instrucao,
  email,
  id as uuid_real,
  CASE 
    WHEN email = 'admin@condominio.com.br' THEN 'Copie este UUID para o admin'
    WHEN email = 'morador@condominio.com.br' THEN 'Copie este UUID para o morador'
  END as uso
FROM usuarios 
WHERE email IN ('admin@condominio.com.br', 'morador@condominio.com.br')
ORDER BY email; 
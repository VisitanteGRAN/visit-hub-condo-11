-- SCRIPT COMPLETO PARA CORRIGIR TODOS OS PROBLEMAS DO BANCO
-- Execute TUDO no SQL Editor do Supabase Dashboard

-- ========================================
-- 1. CORRIGIR TABELA USUARIOS
-- ========================================

-- Adicionar colunas CPF e telefone se não existirem
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);

-- ========================================
-- 2. CORRIGIR TABELA VISITANTES
-- ========================================

-- Adicionar coluna documento se não existir
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS documento VARCHAR(50);

-- ========================================
-- 3. INSERIR USUÁRIOS DE TESTE COM UUIDs CORRETOS
-- ========================================

-- Deletar usuários teste se existirem (para recriá-los)
DELETE FROM usuarios WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);

-- Inserir usuário ADMIN
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
  '$2b$10$sample.hash.for.admin',
  'Administrador Sistema',
  'admin',
  'Administração',
  true,
  '00000000191',
  '(11) 0000-0000'
);

-- Inserir usuário MORADOR
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
  '$2b$10$sample.hash.for.morador',
  'Morador Teste',
  'morador',
  'Apto 101',
  true,
  '12345678901',
  '(11) 99999-9999'
);

-- ========================================
-- 4. VERIFICAR ESTRUTURAS DAS TABELAS
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

-- Ver estrutura da tabela links_convite
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'links_convite' 
ORDER BY ordinal_position;

-- ========================================
-- 5. VERIFICAR USUÁRIOS CRIADOS
-- ========================================

SELECT id, email, nome, perfil, unidade, ativo, cpf, telefone
FROM usuarios 
WHERE email IN ('admin@condominio.com.br', 'morador@condominio.com.br')
ORDER BY email;

-- ========================================
-- 6. VERIFICAR CONSTRAINTS E FOREIGN KEYS
-- ========================================

SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('links_convite', 'visitantes'); 
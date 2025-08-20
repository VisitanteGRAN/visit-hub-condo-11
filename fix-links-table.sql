-- VERIFICAR E CORRIGIR TABELA LINKS_CONVITE
-- Execute no SQL Editor do Supabase Dashboard

-- ========================================
-- 1. VER ESTRUTURA DA TABELA LINKS_CONVITE
-- ========================================

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'links_convite' 
ORDER BY ordinal_position;

-- ========================================
-- 2. ADICIONAR COLUNAS QUE PODEM ESTAR FALTANDO
-- ========================================

-- Adicionar usado se não existir
ALTER TABLE links_convite ADD COLUMN IF NOT EXISTS usado BOOLEAN DEFAULT FALSE;

-- Adicionar data_uso se não existir
ALTER TABLE links_convite ADD COLUMN IF NOT EXISTS data_uso TIMESTAMP;

-- Adicionar visitante_id se não existir (para linkar com o visitante criado)
ALTER TABLE links_convite ADD COLUMN IF NOT EXISTS visitante_id UUID;

-- ========================================
-- 3. VERIFICAR ESTRUTURA APÓS MUDANÇAS
-- ========================================

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'links_convite' 
ORDER BY ordinal_position;

-- ========================================
-- 4. VER LINKS EXISTENTES
-- ========================================

SELECT id, token, morador_id, nome_visitante, usado, created_at, expires_at
FROM links_convite 
ORDER BY created_at DESC
LIMIT 5; 
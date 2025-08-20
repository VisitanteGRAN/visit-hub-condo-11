-- ADICIONAR COLUNA EMAIL NA TABELA VISITANTES
-- Execute no SQL Editor do Supabase Dashboard

-- ========================================
-- 1. VER ESTRUTURA ATUAL DA TABELA VISITANTES
-- ========================================

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'visitantes' 
ORDER BY ordinal_position;

-- ========================================
-- 2. ADICIONAR COLUNA EMAIL SE NÃO EXISTIR
-- ========================================

ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- ========================================
-- 3. VERIFICAR ESTRUTURA APÓS MUDANÇA
-- ========================================

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'visitantes' 
ORDER BY ordinal_position;

-- ========================================
-- 4. VERIFICAR SE HÁ VISITANTES EXISTENTES
-- ========================================

SELECT COUNT(*) as total_visitantes FROM visitantes; 
-- ADICIONAR TODAS AS COLUNAS FALTANTES NA TABELA VISITANTES
-- Execute no SQL Editor do Supabase Dashboard

-- ========================================
-- 1. VER ESTRUTURA ATUAL DA TABELA VISITANTES
-- ========================================

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'visitantes' 
ORDER BY ordinal_position;

-- ========================================
-- 2. ADICIONAR TODAS AS COLUNAS NECESSÁRIAS
-- ========================================

-- Adicionar email se não existir
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Adicionar telefone se não existir
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);

-- Adicionar documento se não existir (já deve estar)
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS documento VARCHAR(50);

-- Adicionar outras colunas que podem estar faltando
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS foto TEXT;
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS hikcentral_id VARCHAR(100);
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS validade_dias INTEGER DEFAULT 1;
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMP;

-- ========================================
-- 3. VERIFICAR ESTRUTURA APÓS TODAS AS MUDANÇAS
-- ========================================

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'visitantes' 
ORDER BY ordinal_position;

-- ========================================
-- 4. VERIFICAR SE HÁ VISITANTES EXISTENTES
-- ========================================

SELECT COUNT(*) as total_visitantes FROM visitantes;

-- ========================================
-- 5. MOSTRAR ALGUMAS LINHAS DE EXEMPLO (SE EXISTIREM)
-- ========================================

SELECT * FROM visitantes LIMIT 5; 
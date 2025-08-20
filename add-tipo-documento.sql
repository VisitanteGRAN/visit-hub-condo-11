-- ADICIONAR COLUNA TIPO_DOCUMENTO NA TABELA VISITANTES
-- Execute no SQL Editor do Supabase Dashboard

-- Adicionar coluna tipo_documento
ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(20) DEFAULT 'RG';

-- Verificar estrutura após mudança
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'visitantes' 
ORDER BY ordinal_position; 
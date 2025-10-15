-- Verificar e corrigir nomes das colunas na tabela usuarios
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar colunas existentes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY column_name;

-- 2. Adicionar colunas com nomes exatos (case-sensitive)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS "rua" TEXT;

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS "numeroRua" TEXT;

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS "quadra" TEXT;

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS "lote" TEXT;

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS "rg" TEXT;

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS "digital_signature" TEXT;

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS "signature_timestamp" TIMESTAMPTZ;

-- 3. Verificar se as colunas foram criadas com nomes corretos
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name IN ('rua', 'numeroRua', 'quadra', 'lote', 'rg', 'digital_signature', 'signature_timestamp')
ORDER BY column_name;

-- 4. Se ainda não funcionou, tentar com aspas duplas
-- (Execute apenas se as colunas acima não aparecerem)
/*
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "numeroRua" TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS quadra TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lote TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rg TEXT;
*/

-- 5. Mostrar estrutura completa da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

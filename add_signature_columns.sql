-- Adicionar colunas para assinatura digital na tabela usuarios
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna para assinatura digital
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS digital_signature TEXT;

-- 2. Adicionar coluna para timestamp da assinatura
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS signature_timestamp TIMESTAMPTZ;

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN usuarios.digital_signature IS 'Nome completo digitado pelo usuário como assinatura digital';
COMMENT ON COLUMN usuarios.signature_timestamp IS 'Data e hora da aceitação do termo com assinatura digital';

-- 4. Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name IN ('digital_signature', 'signature_timestamp')
ORDER BY column_name;

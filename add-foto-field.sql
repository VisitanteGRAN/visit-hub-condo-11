-- ADICIONAR CAMPO FOTO NA TABELA USUARIOS
-- Execute no Supabase Dashboard > SQL Editor

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto TEXT;

-- Verificar se foi adicionado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = "usuarios" 
AND table_schema = "public"
ORDER BY ordinal_position;

-- Verificar se o campo foto existe na tabela usuarios
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Se não existir, adicionar o campo
-- ALTER TABLE usuarios ADD COLUMN foto TEXT;

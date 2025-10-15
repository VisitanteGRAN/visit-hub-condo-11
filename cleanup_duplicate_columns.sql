-- Limpar colunas duplicadas na tabela usuarios
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se temos dados na coluna minúscula
SELECT COUNT(*) as registros_com_numerorua_minusculo
FROM usuarios 
WHERE numerorua IS NOT NULL;

-- 2. Verificar se temos dados na coluna camelCase
SELECT COUNT(*) as registros_com_numeroRua_camelCase
FROM usuarios 
WHERE "numeroRua" IS NOT NULL;

-- 3. Se a coluna minúscula tiver dados, copiar para a camelCase
UPDATE usuarios 
SET "numeroRua" = numerorua 
WHERE numerorua IS NOT NULL AND "numeroRua" IS NULL;

-- 4. Remover a coluna duplicada (minúscula)
ALTER TABLE usuarios DROP COLUMN IF EXISTS numerorua;

-- 5. Verificar estrutura final
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name LIKE '%rua%'
ORDER BY column_name;

-- 6. Mostrar dados para confirmar
SELECT id, nome, rua, "numeroRua", quadra, lote 
FROM usuarios 
WHERE rua IS NOT NULL 
LIMIT 5;

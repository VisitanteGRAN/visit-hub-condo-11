-- ADICIONAR CAMPO FOTO NA TABELA USUARIOS
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Verificar se o campo foto já existe
DO $$
BEGIN
    -- Verificar se a coluna foto existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'foto' 
        AND table_schema = 'public'
    ) THEN
        -- Adicionar coluna foto se não existir
        ALTER TABLE usuarios ADD COLUMN foto TEXT;
        RAISE NOTICE 'Coluna foto adicionada à tabela usuarios';
    ELSE
        RAISE NOTICE 'Coluna foto já existe na tabela usuarios';
    END IF;
END $$;

-- 2. Verificar estrutura da tabela após modificação
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND table_schema = 'public'
ORDER BY ordinal_position;

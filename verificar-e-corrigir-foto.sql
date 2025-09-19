-- VERIFICAR E CORRIGIR CAMPO FOTO
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se o campo existe
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Forçar criação do campo (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'foto' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN foto TEXT;
        RAISE NOTICE 'Campo foto criado com sucesso!';
    ELSE
        RAISE NOTICE 'Campo foto já existe';
    END IF;
END $$;

-- 3. Testar update de foto (para um usuário existente)
UPDATE usuarios 
SET foto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
WHERE email = 'lacerdalucca1@gmail.com';

-- 4. Verificar se foi atualizado
SELECT id, nome, email, foto IS NOT NULL as tem_foto 
FROM usuarios 
WHERE email = 'lacerdalucca1@gmail.com';

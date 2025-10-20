-- Adicionar coluna nome_normalized para compatibilidade com HikCentral
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna nome_normalized
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS nome_normalized TEXT;

-- 2. Criar função para normalizar texto (remover acentos)
CREATE OR REPLACE FUNCTION normalize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remover acentos e converter para maiúsculo
    RETURN UPPER(
        TRANSLATE(
            input_text,
            'ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçÌÍÎÏìíîïÙÚÛÜùúûüÿÑñ',
            'AAAAAAaaaaaaOOOOOOooooooEEEEeeeeÇcIIIIiiiiUUUUuuuuyNn'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Atualizar registros existentes com nome normalizado
UPDATE usuarios 
SET nome_normalized = normalize_text(nome)
WHERE nome_normalized IS NULL AND nome IS NOT NULL;

-- 4. Criar trigger para atualizar automaticamente nome_normalized
CREATE OR REPLACE FUNCTION update_nome_normalized()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nome_normalized = normalize_text(NEW.nome);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger que executa antes de INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_update_nome_normalized ON usuarios;
CREATE TRIGGER trigger_update_nome_normalized
    BEFORE INSERT OR UPDATE OF nome ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_nome_normalized();

-- 6. Verificar se a coluna foi criada e os dados foram atualizados
SELECT 
    nome,
    nome_normalized,
    CASE 
        WHEN nome_normalized IS NOT NULL THEN '✅ Normalizado'
        ELSE '❌ Não normalizado'
    END as status
FROM usuarios 
WHERE perfil = 'morador' 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name IN ('nome', 'nome_normalized')
ORDER BY column_name;

-- SOLUÇÃO RÁPIDA: DESABILITAR RLS NA TABELA USUARIOS

-- 1. Desabilitar RLS temporariamente
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 2. Aprovar todos os moradores pendentes
UPDATE usuarios 
SET ativo = true, status = 'ativo' 
WHERE perfil = 'morador' 
  AND (ativo = false OR status = 'pendente');

-- 3. Verificar se funcionou
SELECT email, nome, ativo, status 
FROM usuarios 
WHERE perfil = 'morador'
ORDER BY email;

-- 4. OPCIONAL: Reabilitar RLS depois (se necessário)
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

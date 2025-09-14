-- QUICK FIX PARA RLS - Execute este primeiro!

-- 1. Dropar TODAS as políticas da tabela visitantes
DROP POLICY IF EXISTS "Moradores aprovados podem criar visitantes" ON visitantes;
DROP POLICY IF EXISTS "Users can create visitors" ON visitantes;
DROP POLICY IF EXISTS "Visitantes podem ser criados publicamente" ON visitantes;
DROP POLICY IF EXISTS "Visitantes podem ser criados publicamente via link" ON visitantes;
DROP POLICY IF EXISTS "Moradores podem ver seus visitantes" ON visitantes;
DROP POLICY IF EXISTS "Moradores podem atualizar seus visitantes" ON visitantes;
DROP POLICY IF EXISTS "Admins podem gerenciar visitantes" ON visitantes;

-- 2. Criar política SIMPLES para permitir cadastro público
CREATE POLICY "Allow public visitor creation" ON visitantes
    FOR INSERT 
    WITH CHECK (true);

-- 3. Política SIMPLES para leitura por moradores
CREATE POLICY "Allow visitor reading" ON visitantes
    FOR SELECT 
    USING (true);

-- 4. Verificar se funcionou
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'visitantes';

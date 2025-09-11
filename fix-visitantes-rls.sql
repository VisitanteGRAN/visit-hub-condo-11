-- Corrigir políticas RLS para tabela visitantes
-- Execute no SQL Editor do Supabase

-- 1. Verificar políticas atuais
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'visitantes';

-- 2. Dropar políticas antigas se existirem
DROP POLICY IF EXISTS "Users can create visitors" ON visitantes;
DROP POLICY IF EXISTS "Users can read their own visitors" ON visitantes;
DROP POLICY IF EXISTS "Users can update their own visitors" ON visitantes;

-- 3. Criar políticas para visitantes
CREATE POLICY "Moradores aprovados podem criar visitantes" ON visitantes
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND perfil = 'morador' 
            AND ativo = true 
            AND status = 'ativo'
        )
    );

CREATE POLICY "Moradores podem ver seus visitantes" ON visitantes
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL AND 
        (
            morador_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM usuarios 
                WHERE id = auth.uid() 
                AND perfil = 'admin'
            )
        )
    );

CREATE POLICY "Moradores podem atualizar seus visitantes" ON visitantes
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND 
        morador_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND ativo = true 
            AND status = 'ativo'
        )
    );

-- 4. Admins podem gerenciar todos os visitantes
CREATE POLICY "Admins podem gerenciar visitantes" ON visitantes
    FOR ALL 
    USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND perfil = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND perfil = 'admin'
        )
    );

-- 5. Verificar políticas criadas
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'visitantes'
ORDER BY policyname;

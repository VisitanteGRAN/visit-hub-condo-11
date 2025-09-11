-- Corrigir políticas RLS para permitir que moradores aprovados criem links
-- Execute no SQL Editor do Supabase

-- 1. Verificar políticas atuais da tabela links_convite
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'links_convite';

-- 2. Dropar políticas antigas se existirem
DROP POLICY IF EXISTS "Users can create invite links" ON links_convite;
DROP POLICY IF EXISTS "Users can read their own invite links" ON links_convite;
DROP POLICY IF EXISTS "Users can update their own invite links" ON links_convite;

-- 3. Criar novas políticas para moradores aprovados
CREATE POLICY "Moradores aprovados podem criar links" ON links_convite
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

CREATE POLICY "Moradores podem ver seus próprios links" ON links_convite
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

CREATE POLICY "Moradores podem atualizar seus próprios links" ON links_convite
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND 
        morador_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND perfil = 'morador' 
            AND ativo = true 
            AND status = 'ativo'
        )
    );

-- 4. Admins podem fazer tudo
CREATE POLICY "Admins podem gerenciar todos os links" ON links_convite
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

-- 5. Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'links_convite'
ORDER BY policyname;

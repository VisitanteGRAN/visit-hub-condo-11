-- CORRIGIR RLS PARA PERMITIR LEITURA PÚBLICA DE LINKS_CONVITE
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Verificar políticas atuais na tabela links_convite
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'links_convite';

-- 2. Dropar políticas restritivas existentes
DROP POLICY IF EXISTS "Moradores podem gerenciar seus links" ON links_convite;
DROP POLICY IF EXISTS "Users can manage their own invitation links" ON links_convite;
DROP POLICY IF EXISTS "Links podem ser lidos publicamente" ON links_convite;

-- 3. NOVA POLÍTICA: Permitir leitura pública de links para validação
CREATE POLICY "Links podem ser lidos publicamente para validacao" ON links_convite
    FOR SELECT 
    USING (
        -- Permitir leitura pública de links válidos (não usados, não expirados)
        usado = false AND 
        expirado = false AND 
        expires_at > NOW()
    );

-- 4. Política para criação (apenas moradores aprovados)
CREATE POLICY "Moradores aprovados podem criar links" ON links_convite
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        morador_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND ativo = true 
            AND status = 'ativo'
            AND perfil = 'morador'
        )
    );

-- 5. Política para atualização (apenas proprietários)
CREATE POLICY "Moradores podem atualizar seus links" ON links_convite
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL AND 
        morador_id = auth.uid()
    );

-- 6. Admins podem fazer tudo
CREATE POLICY "Admins podem gerenciar todos os links" ON links_convite
    FOR ALL 
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND perfil = 'admin'
        )
    );

-- 7. Verificar se as políticas foram criadas
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'links_convite'
ORDER BY policyname;

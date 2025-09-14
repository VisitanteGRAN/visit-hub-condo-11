-- CORRIGIR RLS PARA PERMITIR CADASTRO PÚBLICO DE VISITANTES
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Verificar políticas atuais
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'visitantes';

-- 2. Dropar política restritiva se existir
DROP POLICY IF EXISTS "Moradores aprovados podem criar visitantes" ON visitantes;
DROP POLICY IF EXISTS "Users can create visitors" ON visitantes;
DROP POLICY IF EXISTS "Visitantes podem ser criados publicamente" ON visitantes;

-- 3. NOVA POLÍTICA: Permitir criação pública via link válido
CREATE POLICY "Visitantes podem ser criados publicamente via link" ON visitantes
    FOR INSERT 
    WITH CHECK (
        -- Permitir inserção se o link_convite_id existe e está válido
        link_convite_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM links_convite 
            WHERE id = link_convite_id 
            AND usado = false 
            AND expirado = false 
            AND expires_at > NOW()
        )
    );

-- 4. Política para leitura (moradores e admins)
CREATE POLICY IF NOT EXISTS "Moradores podem ver seus visitantes" ON visitantes
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

-- 5. Política para atualização (apenas moradores proprietários)
CREATE POLICY IF NOT EXISTS "Moradores podem atualizar seus visitantes" ON visitantes
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

-- 6. Admins podem fazer tudo
CREATE POLICY IF NOT EXISTS "Admins podem gerenciar visitantes" ON visitantes
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
WHERE tablename = 'visitantes'
ORDER BY policyname;

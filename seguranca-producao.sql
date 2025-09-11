-- 🔐 CONFIGURAÇÃO DE SEGURANÇA PARA PRODUÇÃO

-- 1. REABILITAR RLS na tabela usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 2. LIMPAR políticas antigas
DROP POLICY IF EXISTS "Admin total access" ON usuarios;
DROP POLICY IF EXISTS "Morador own data" ON usuarios;
DROP POLICY IF EXISTS "Allow registration" ON usuarios;
DROP POLICY IF EXISTS "Users can read own data" ON usuarios;
DROP POLICY IF EXISTS "Users can only read own data" ON usuarios;
DROP POLICY IF EXISTS "Users can only update own data" ON usuarios;

-- 3. POLÍTICA PARA ADMIN - Acesso total
CREATE POLICY "Admin can manage all users" ON usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            WHERE u.supabase_user_id = auth.uid()
            AND u.perfil = 'admin'
            AND u.ativo = true
            AND u.status = 'ativo'
        )
    );

-- 4. POLÍTICA PARA MORADOR - Só próprios dados
CREATE POLICY "Morador can read own data" ON usuarios
    FOR SELECT USING (
        supabase_user_id = auth.uid() 
        AND perfil = 'morador'
        AND ativo = true 
        AND status = 'ativo'
    );

-- 5. POLÍTICA PARA NOVOS CADASTROS - Permitir registro
CREATE POLICY "Allow new user registration" ON usuarios
    FOR INSERT WITH CHECK (
        perfil = 'morador' 
        AND ativo = false 
        AND status = 'pendente'
        AND supabase_user_id IS NULL
    );

-- 6. APLICAR RLS em outras tabelas importantes
ALTER TABLE links_convite ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_registration_queue ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS PARA LINKS_CONVITE
CREATE POLICY "Users can manage own links" ON links_convite
    FOR ALL USING (
        morador_id IN (
            SELECT id FROM usuarios 
            WHERE supabase_user_id = auth.uid()
            AND ativo = true
        )
    );

-- 8. POLÍTICAS PARA VISITANTES  
CREATE POLICY "Users can manage own visitors" ON visitantes
    FOR ALL USING (
        morador_id IN (
            SELECT id FROM usuarios 
            WHERE supabase_user_id = auth.uid()
            AND ativo = true
        )
    );

-- 9. POLÍTICAS PARA QUEUE
CREATE POLICY "Users can access own queue items" ON visitor_registration_queue
    FOR ALL USING (
        created_by = auth.uid()
    );

-- 10. VERIFICAR políticas criadas
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('usuarios', 'links_convite', 'visitantes', 'visitor_registration_queue')
ORDER BY tablename, policyname;

-- CORRIGIR POLÍTICAS RLS PARA PERMITIR ADMIN APROVAR USUÁRIOS

-- 1. Ver políticas atuais da tabela usuarios
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'usuarios';

-- 2. REMOVER políticas restritivas se existirem
DROP POLICY IF EXISTS "Users can only read own data" ON usuarios;
DROP POLICY IF EXISTS "Users can only update own data" ON usuarios;

-- 3. CRIAR políticas corretas para admin poder aprovar
CREATE POLICY "Admin can manage all users" ON usuarios
    FOR ALL USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE supabase_user_id = auth.uid() 
            AND perfil = 'admin'
        )
    );

-- 4. CRIAR política para moradores lerem apenas seus dados
CREATE POLICY "Users can read own data" ON usuarios
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        (
            supabase_user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM usuarios 
                WHERE supabase_user_id = auth.uid() 
                AND perfil = 'admin'
            )
        )
    );

-- 5. PERMITIR inserção para novos registros
CREATE POLICY "Allow registration" ON usuarios
    FOR INSERT WITH CHECK (true);

-- 6. TESTE: Aprovar usuários pendentes (deve funcionar agora)
UPDATE usuarios 
SET ativo = true, status = 'ativo' 
WHERE perfil = 'morador' 
  AND (ativo = false OR status = 'pendente');

-- 7. Verificar resultado
SELECT email, nome, ativo, status 
FROM usuarios 
WHERE perfil = 'morador'
ORDER BY email;

-- REABILITAR RLS DE FORMA SEGURA PARA PRODUÇÃO

-- 1. Reabilitar RLS na tabela usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 2. Política para admin - pode fazer tudo
CREATE POLICY "Admin total access" ON usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            WHERE u.email = auth.email()
            AND u.perfil = 'admin'
            AND u.ativo = true
        )
    );

-- 3. Política para morador - só seus próprios dados
CREATE POLICY "Morador own data" ON usuarios
    FOR SELECT USING (
        email = auth.email() AND perfil = 'morador'
    );

-- 4. Permitir cadastro de novos usuários
CREATE POLICY "Allow registration" ON usuarios
    FOR INSERT WITH CHECK (
        perfil = 'morador' AND 
        ativo = false AND 
        status = 'pendente'
    );

-- QUANDO QUISER APLICAR:
-- Execute este script no Supabase SQL Editor

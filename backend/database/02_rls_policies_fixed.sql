-- Políticas de RLS (Row Level Security) CORRIGIDAS - sem recursão infinita
-- Execute este script após o schema inicial

-- Primeiro, vamos desabilitar RLS temporariamente para corrigir
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE links_convite DISABLE ROW LEVEL SECURITY;
ALTER TABLE visitantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas antigas se existirem
DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_auth" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_auth" ON usuarios;

DROP POLICY IF EXISTS "links_convite_select_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_insert_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_update_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_delete_own" ON links_convite;
DROP POLICY IF EXISTS "links_convite_select_all" ON links_convite;
DROP POLICY IF EXISTS "links_convite_insert_auth" ON usuarios;
DROP POLICY IF EXISTS "links_convite_delete_auth" ON usuarios;

DROP POLICY IF EXISTS "visitantes_select_policy" ON visitantes;
DROP POLICY IF EXISTS "visitantes_insert_policy" ON visitantes;
DROP POLICY IF EXISTS "visitantes_update_policy" ON visitantes;
DROP POLICY IF EXISTS "visitantes_delete_policy" ON visitantes;
DROP POLICY IF EXISTS "visitantes_select_all" ON visitantes;
DROP POLICY IF EXISTS "visitantes_insert_auth" ON visitantes;
DROP POLICY IF EXISTS "visitantes_delete_auth" ON visitantes;

DROP POLICY IF EXISTS "logs_acesso_select_all" ON logs_acesso;
DROP POLICY IF EXISTS "logs_acesso_insert_auth" ON logs_acesso;

DROP POLICY IF EXISTS "configuracoes_select_all" ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_insert_auth" ON configuracoes;

DROP POLICY IF EXISTS "notificacoes_select_all" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_insert_auth" ON notificacoes;

-- Políticas SIMPLIFICADAS para evitar recursão
-- Usuários podem ver todos os usuários (para login e navegação)
CREATE POLICY "usuarios_select_all" ON usuarios
    FOR SELECT USING (true);

-- Apenas usuários autenticados podem inserir (para registro)
CREATE POLICY "usuarios_insert_auth" ON usuarios
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "usuarios_update_own" ON usuarios
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Apenas usuários autenticados podem deletar (com restrições no código)
CREATE POLICY "usuarios_delete_auth" ON usuarios
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas para links_convite
CREATE POLICY "links_convite_select_all" ON links_convite
    FOR SELECT USING (true);

CREATE POLICY "links_convite_insert_auth" ON links_convite
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "links_convite_update_own" ON links_convite
    FOR UPDATE USING (morador_id::text = auth.uid()::text);

CREATE POLICY "links_convite_delete_own" ON links_convite
    FOR DELETE USING (morador_id::text = auth.uid()::text);

-- Políticas para visitantes
CREATE POLICY "visitantes_select_all" ON visitantes
    FOR SELECT USING (true);

CREATE POLICY "visitantes_insert_auth" ON visitantes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "visitantes_update_own" ON visitantes
    FOR UPDATE USING (morador_id::text = auth.uid()::text);

CREATE POLICY "visitantes_delete_own" ON visitantes
    FOR DELETE USING (morador_id::text = auth.uid()::text);

-- Políticas para outras tabelas
CREATE POLICY "logs_acesso_select_all" ON logs_acesso
    FOR SELECT USING (true);

CREATE POLICY "logs_acesso_insert_auth" ON logs_acesso
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "configuracoes_select_all" ON configuracoes
    FOR SELECT USING (true);

CREATE POLICY "configuracoes_insert_auth" ON configuracoes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notificacoes_select_all" ON notificacoes
    FOR SELECT USING (true);

CREATE POLICY "notificacoes_insert_auth" ON notificacoes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Agora habilitar RLS novamente
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE links_convite ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY; 
-- Políticas de RLS (Row Level Security) para segurança dos dados
-- Execute este script após o schema inicial

-- Habilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE links_convite ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela usuarios
-- Usuários podem ver apenas seus próprios dados (exceto admins)
CREATE POLICY "usuarios_select_own" ON usuarios
    FOR SELECT USING (
        auth.uid()::text = id::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Apenas admins podem inserir novos usuários
CREATE POLICY "usuarios_insert_admin" ON usuarios
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Usuários podem atualizar apenas seus próprios dados (exceto admins)
CREATE POLICY "usuarios_update_own" ON usuarios
    FOR UPDATE USING (
        auth.uid()::text = id::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Apenas admins podem deletar usuários
CREATE POLICY "usuarios_delete_admin" ON usuarios
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Políticas para tabela links_convite
-- Moradores podem ver apenas seus próprios links
CREATE POLICY "links_convite_select_own" ON links_convite
    FOR SELECT USING (
        morador_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Moradores podem criar seus próprios links
CREATE POLICY "links_convite_insert_own" ON links_convite
    FOR INSERT WITH CHECK (
        morador_id::text = auth.uid()::text
    );

-- Moradores podem atualizar apenas seus próprios links
CREATE POLICY "links_convite_update_own" ON links_convite
    FOR UPDATE USING (
        morador_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Moradores podem deletar apenas seus próprios links
CREATE POLICY "links_convite_delete_own" ON links_convite
    FOR DELETE USING (
        morador_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Políticas para tabela visitantes
-- Moradores podem ver visitantes de sua unidade, admins veem todos
CREATE POLICY "visitantes_select_policy" ON visitantes
    FOR SELECT USING (
        morador_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text 
            AND u.unidade = visitantes.unidade 
            AND u.perfil = 'morador'
        )
    );

-- Visitantes podem ser inseridos via link de convite ou por moradores/admins
CREATE POLICY "visitantes_insert_policy" ON visitantes
    FOR INSERT WITH CHECK (
        morador_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Moradores podem atualizar visitantes de sua responsabilidade
CREATE POLICY "visitantes_update_policy" ON visitantes
    FOR UPDATE USING (
        morador_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Apenas admins podem deletar visitantes
CREATE POLICY "visitantes_delete_admin" ON visitantes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Políticas para tabela logs_acesso
-- Moradores podem ver logs de seus visitantes, admins veem todos
CREATE POLICY "logs_acesso_select_policy" ON logs_acesso
    FOR SELECT USING (
        morador_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Logs são inseridos pelo sistema (service role)
CREATE POLICY "logs_acesso_insert_system" ON logs_acesso
    FOR INSERT WITH CHECK (true);

-- Logs não podem ser atualizados
-- Logs não podem ser deletados (apenas por admins em casos especiais)
CREATE POLICY "logs_acesso_delete_admin" ON logs_acesso
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Políticas para tabela configuracoes
-- Apenas admins podem ver/editar configurações
CREATE POLICY "configuracoes_admin_only" ON configuracoes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Políticas para tabela notificacoes
-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "notificacoes_select_own" ON notificacoes
    FOR SELECT USING (
        usuario_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

-- Sistema pode inserir notificações
CREATE POLICY "notificacoes_insert_system" ON notificacoes
    FOR INSERT WITH CHECK (true);

-- Usuários podem marcar suas notificações como lidas
CREATE POLICY "notificacoes_update_own" ON notificacoes
    FOR UPDATE USING (
        usuario_id::text = auth.uid()::text
    ) WITH CHECK (
        usuario_id::text = auth.uid()::text
    );

-- Usuários podem deletar suas próprias notificações
CREATE POLICY "notificacoes_delete_own" ON notificacoes
    FOR DELETE USING (
        usuario_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id::text = auth.uid()::text AND u.perfil = 'admin'
        )
    );

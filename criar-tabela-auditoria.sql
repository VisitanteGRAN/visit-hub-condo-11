-- 📊 CRIAR TABELA DE AUDITORIA PARA MONITORAMENTO

-- 1. Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 3. RLS para auditoria (apenas admin pode ver)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            WHERE u.supabase_user_id = auth.uid()
            AND u.perfil = 'admin'
            AND u.ativo = true
        )
    );

-- 4. Permitir inserção para sistema (sem RLS para writes)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- 5. Função para limpeza automática (manter apenas últimos 6 meses)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- 6. Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para rastreamento de ações do sistema';
COMMENT ON COLUMN audit_logs.action IS 'Ação realizada (LOGIN_SUCCESS, USER_APPROVED, etc.)';
COMMENT ON COLUMN audit_logs.resource IS 'Recurso afetado (auth, usuarios, visitantes, etc.)';
COMMENT ON COLUMN audit_logs.details IS 'Detalhes adicionais em formato JSON';

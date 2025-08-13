-- Dados iniciais para o sistema de gestão de visitantes
-- Execute após a criação do schema e políticas RLS

-- Inserir configurações padrão do sistema
INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES
('sistema_nome', 'Visit Hub Condo', 'string', 'Nome do sistema'),
('validade_padrao_dias', '1', 'number', 'Validade padrão para visitantes em dias'),
('validade_maxima_dias', '7', 'number', 'Validade máxima para visitantes em dias'),
('link_expiracao_horas', '24', 'number', 'Tempo de expiração dos links de convite em horas'),
('max_visitantes_por_morador', '10', 'number', 'Máximo de visitantes ativos por morador'),
('notificacoes_ativas', 'true', 'boolean', 'Sistema de notificações ativo'),
('hikvision_sync_ativo', 'true', 'boolean', 'Sincronização com Hikvision ativa'),
('lgpd_retencao_dias', '365', 'number', 'Dias de retenção de dados pessoais (LGPD)'),
('horario_funcionamento', '{"inicio": "06:00", "fim": "22:00"}', 'json', 'Horário de funcionamento da portaria'),
('upload_max_size_mb', '10', 'number', 'Tamanho máximo de upload em MB'),
('selfie_qualidade_min', '80', 'number', 'Qualidade mínima da selfie (0-100)'),
('documento_tipos_aceitos', '["RG", "CNH", "Passaporte"]', 'json', 'Tipos de documento aceitos'),
('backup_automatico', 'true', 'boolean', 'Backup automático ativo'),
('logs_retencao_dias', '90', 'number', 'Dias de retenção dos logs'),
('rate_limit_requests', '100', 'number', 'Limite de requisições por IP por hora');

-- Criar usuário administrador padrão
-- Senha: Admin@123456 (deve ser alterada no primeiro login)
INSERT INTO usuarios (
    id,
    email, 
    senha_hash, 
    nome, 
    perfil, 
    ativo
) VALUES (
    uuid_generate_v4(),
    'admin@condominio.com.br',
    '$2b$12$LQv3c1yqBwEHXw8YQK0MK.dQqHrFVgw/r8jKhQwZ1jQhGvNh9Ct9u', -- Admin@123456
    'Administrador Sistema',
    'admin',
    true
);

-- Exemplos de moradores para testes (opcional - remover em produção)
INSERT INTO usuarios (
    email,
    senha_hash,
    nome,
    perfil,
    unidade,
    ativo
) VALUES 
    ('morador1@email.com', '$2b$12$LQv3c1yqBwEHXw8YQK0MK.dQqHrFVgw/r8jKhQwZ1jQhGvNh9Ct9u', 'João Silva', 'morador', 'Apto 101', true),
    ('morador2@email.com', '$2b$12$LQv3c1yqBwEHXw8YQK0MK.dQqHrFVgw/r8jKhQwZ1jQhGvNh9Ct9u', 'Maria Santos', 'morador', 'Apto 202', true),
    ('morador3@email.com', '$2b$12$LQv3c1yqBwEHXw8YQK0MK.dQqHrFVgw/r8jKhQwZ1jQhGvNh9Ct9u', 'Carlos Oliveira', 'morador', 'Casa 15', true);

-- Criar funções úteis para o sistema

-- Função para limpar dados expirados (LGPD compliance)
CREATE OR REPLACE FUNCTION limpar_dados_expirados()
RETURNS INTEGER AS $$
DECLARE
    dias_retencao INTEGER;
    registros_removidos INTEGER := 0;
BEGIN
    -- Buscar configuração de retenção LGPD
    SELECT valor::INTEGER INTO dias_retencao 
    FROM configuracoes 
    WHERE chave = 'lgpd_retencao_dias';
    
    IF dias_retencao IS NULL THEN
        dias_retencao := 365; -- Padrão 1 ano
    END IF;
    
    -- Remover visitantes expirados há mais tempo que o período de retenção
    DELETE FROM visitantes 
    WHERE status = 'expirado' 
    AND validade_fim < NOW() - INTERVAL '1 day' * dias_retencao;
    
    GET DIAGNOSTICS registros_removidos = ROW_COUNT;
    
    -- Remover logs antigos
    DELETE FROM logs_acesso 
    WHERE created_at < NOW() - INTERVAL '1 day' * 90; -- 90 dias de logs
    
    -- Remover notificações antigas
    DELETE FROM notificacoes 
    WHERE created_at < NOW() - INTERVAL '1 day' * 30; -- 30 dias de notificações
    
    -- Remover links de convite expirados antigos
    DELETE FROM links_convite 
    WHERE expires_at < NOW() - INTERVAL '1 day' * 7; -- 7 dias após expiração
    
    RETURN registros_removidos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar visitantes expirados
CREATE OR REPLACE FUNCTION verificar_visitantes_expirados()
RETURNS TABLE(id UUID, nome VARCHAR, cpf VARCHAR, morador_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT v.id, v.nome, v.cpf, v.morador_id
    FROM visitantes v
    WHERE v.status IN ('ativo', 'liberado')
    AND v.validade_fim < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para estatísticas do sistema
CREATE OR REPLACE FUNCTION estatisticas_sistema()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_usuarios', (SELECT COUNT(*) FROM usuarios WHERE ativo = true),
        'total_moradores', (SELECT COUNT(*) FROM usuarios WHERE perfil = 'morador' AND ativo = true),
        'total_admins', (SELECT COUNT(*) FROM usuarios WHERE perfil = 'admin' AND ativo = true),
        'visitantes_ativos', (SELECT COUNT(*) FROM visitantes WHERE status IN ('ativo', 'liberado')),
        'visitantes_aguardando', (SELECT COUNT(*) FROM visitantes WHERE status = 'aguardando'),
        'visitantes_expirados', (SELECT COUNT(*) FROM visitantes WHERE status = 'expirado'),
        'acessos_hoje', (SELECT COUNT(*) FROM logs_acesso WHERE DATE(data_hora) = CURRENT_DATE),
        'acessos_semana', (SELECT COUNT(*) FROM logs_acesso WHERE data_hora >= DATE_TRUNC('week', NOW())),
        'links_ativos', (SELECT COUNT(*) FROM links_convite WHERE NOT expirado AND NOT usado),
        'notificacoes_nao_lidas', (SELECT COUNT(*) FROM notificacoes WHERE NOT lida)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar token de convite único
CREATE OR REPLACE FUNCTION gerar_token_convite()
RETURNS VARCHAR(64) AS $$
DECLARE
    novo_token VARCHAR(64);
    token_existe BOOLEAN;
BEGIN
    LOOP
        -- Gerar token hexadecimal de 32 bytes (64 caracteres)
        novo_token := encode(gen_random_bytes(32), 'hex');
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM links_convite WHERE token = novo_token) INTO token_existe;
        
        -- Se não existe, retornar o token
        IF NOT token_existe THEN
            RETURN novo_token;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para facilitar consultas de visitantes com informações do morador
CREATE VIEW vw_visitantes_detalhado AS
SELECT 
    v.id,
    v.nome,
    v.cpf,
    v.selfie_url,
    v.documento_url,
    v.status,
    v.unidade,
    v.validade_inicio,
    v.validade_fim,
    v.hikvision_user_id,
    v.consentimento_lgpd,
    v.observacoes,
    v.created_at,
    v.updated_at,
    u.nome as morador_nome,
    u.email as morador_email,
    CASE 
        WHEN v.validade_fim < NOW() THEN true 
        ELSE false 
    END as expirado
FROM visitantes v
JOIN usuarios u ON v.morador_id = u.id;

-- View para relatórios de acesso
CREATE VIEW vw_relatorio_acessos AS
SELECT 
    la.id,
    la.tipo,
    la.data_hora,
    la.local,
    la.sucesso,
    la.observacoes,
    v.nome as visitante_nome,
    v.cpf as visitante_cpf,
    v.unidade,
    u.nome as morador_nome,
    u.email as morador_email
FROM logs_acesso la
JOIN visitantes v ON la.visitante_id = v.id
JOIN usuarios u ON la.morador_id = u.id
ORDER BY la.data_hora DESC;

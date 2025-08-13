-- Esquema inicial do banco de dados para o sistema de gestão de visitantes
-- Execute este script no Supabase SQL Editor

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos enumerados
CREATE TYPE user_profile AS ENUM ('morador', 'admin');
CREATE TYPE visitor_status AS ENUM ('aguardando', 'liberado', 'expirado', 'cancelado', 'ativo');
CREATE TYPE access_type AS ENUM ('entrada', 'saida');
CREATE TYPE config_type AS ENUM ('string', 'number', 'boolean', 'json');
CREATE TYPE notification_type AS ENUM ('entrada_visitante', 'cadastro_concluido', 'acesso_expirado');

-- Tabela de usuários (moradores e admins)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    perfil user_profile NOT NULL DEFAULT 'morador',
    unidade VARCHAR(50),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de links de convite
CREATE TABLE links_convite (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(64) UNIQUE NOT NULL,
    morador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_visitante VARCHAR(255) NOT NULL,
    expirado BOOLEAN DEFAULT false,
    usado BOOLEAN DEFAULT false,
    validade_dias INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabela de visitantes
CREATE TABLE visitantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    selfie_url TEXT,
    documento_url TEXT,
    status visitor_status DEFAULT 'aguardando',
    unidade VARCHAR(50) NOT NULL,
    morador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    link_convite_id UUID REFERENCES links_convite(id) ON DELETE SET NULL,
    validade_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    validade_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    hikvision_user_id VARCHAR(50),
    consentimento_lgpd BOOLEAN DEFAULT false,
    consentimento_data TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de acesso
CREATE TABLE logs_acesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitante_id UUID NOT NULL REFERENCES visitantes(id) ON DELETE CASCADE,
    morador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo access_type NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    local VARCHAR(100) DEFAULT 'Portaria Principal',
    sucesso BOOLEAN DEFAULT true,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo config_type DEFAULT 'string',
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo notification_type NOT NULL,
    lida BOOLEAN DEFAULT false,
    dados_extras JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX idx_usuarios_unidade ON usuarios(unidade);

CREATE INDEX idx_links_convite_token ON links_convite(token);
CREATE INDEX idx_links_convite_morador ON links_convite(morador_id);
CREATE INDEX idx_links_convite_expires ON links_convite(expires_at);

CREATE INDEX idx_visitantes_cpf ON visitantes(cpf);
CREATE INDEX idx_visitantes_status ON visitantes(status);
CREATE INDEX idx_visitantes_morador ON visitantes(morador_id);
CREATE INDEX idx_visitantes_unidade ON visitantes(unidade);
CREATE INDEX idx_visitantes_validade ON visitantes(validade_fim);
CREATE INDEX idx_visitantes_hikvision ON visitantes(hikvision_user_id);

CREATE INDEX idx_logs_acesso_visitante ON logs_acesso(visitante_id);
CREATE INDEX idx_logs_acesso_data ON logs_acesso(data_hora);
CREATE INDEX idx_logs_acesso_tipo ON logs_acesso(tipo);

CREATE INDEX idx_configuracoes_chave ON configuracoes(chave);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_created ON notificacoes(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitantes_updated_at BEFORE UPDATE ON visitantes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

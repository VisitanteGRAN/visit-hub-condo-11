-- TABELA DE FILA DE CADASTROS PARA POLLING
-- Windows vai verificar essa tabela periodicamente

CREATE TABLE IF NOT EXISTS visitor_registration_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_data JSONB NOT NULL,
    photo_base64 TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority INTEGER DEFAULT 1,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id)
);

-- Criar índices separadamente
CREATE INDEX IF NOT EXISTS idx_queue_status ON visitor_registration_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_created ON visitor_registration_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON visitor_registration_queue(priority);

-- RLS (Row Level Security)
ALTER TABLE visitor_registration_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem criar registros
CREATE POLICY "Users can create queue items" ON visitor_registration_queue
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Usuários podem ver seus próprios registros
CREATE POLICY "Users can view own queue items" ON visitor_registration_queue
    FOR SELECT USING (auth.uid() = created_by);

-- Policy: Sistema pode atualizar qualquer registro (via service key)
CREATE POLICY "Service can update queue items" ON visitor_registration_queue
    FOR UPDATE USING (true);

-- Policy: Sistema pode ler todos os registros (via service key)
CREATE POLICY "Service can read all queue items" ON visitor_registration_queue
    FOR SELECT USING (true);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_visitor_queue_updated_at 
    BEFORE UPDATE ON visitor_registration_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para buscar próximo item da fila
CREATE OR REPLACE FUNCTION get_next_queue_item()
RETURNS visitor_registration_queue AS $$
DECLARE
    queue_item visitor_registration_queue;
BEGIN
    -- Buscar próximo item pendente, ordenado por prioridade e data
    SELECT * INTO queue_item
    FROM visitor_registration_queue
    WHERE status = 'pending' 
    AND attempts < max_attempts
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    -- Marcar como processando
    IF queue_item.id IS NOT NULL THEN
        UPDATE visitor_registration_queue 
        SET 
            status = 'processing',
            attempts = attempts + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = queue_item.id;
        
        -- Retornar item atualizado
        SELECT * INTO queue_item
        FROM visitor_registration_queue
        WHERE id = queue_item.id;
    END IF;
    
    RETURN queue_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar item como concluído
CREATE OR REPLACE FUNCTION mark_queue_item_completed(item_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE visitor_registration_queue 
    SET 
        status = 'completed',
        processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar item como falhado
CREATE OR REPLACE FUNCTION mark_queue_item_failed(item_id UUID, error_msg TEXT)
RETURNS void AS $$
BEGIN
    UPDATE visitor_registration_queue 
    SET 
        status = CASE 
            WHEN attempts >= max_attempts THEN 'failed'
            ELSE 'pending'
        END,
        error_message = error_msg,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para estatísticas da fila
CREATE OR REPLACE VIEW queue_stats AS
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM visitor_registration_queue
GROUP BY status;

-- Comentários para documentação
COMMENT ON TABLE visitor_registration_queue IS 'Fila de cadastros de visitantes para processamento pelo Windows';
COMMENT ON COLUMN visitor_registration_queue.visitor_data IS 'Dados do visitante em formato JSON';
COMMENT ON COLUMN visitor_registration_queue.photo_base64 IS 'Foto do visitante em base64';
COMMENT ON COLUMN visitor_registration_queue.priority IS 'Prioridade (1=baixa, 5=alta)';
COMMENT ON COLUMN visitor_registration_queue.attempts IS 'Número de tentativas de processamento';
COMMENT ON FUNCTION get_next_queue_item() IS 'Retorna próximo item da fila para processamento'; 
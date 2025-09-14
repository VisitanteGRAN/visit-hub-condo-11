-- CORRIGIR RLS PARA VISITOR_REGISTRATION_QUEUE
-- Execute no Supabase SQL Editor

-- 1. Verificar políticas atuais da fila
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'visitor_registration_queue';

-- 2. Dropar políticas restritivas da fila
DROP POLICY IF EXISTS "Users can create queue items" ON visitor_registration_queue;
DROP POLICY IF EXISTS "Users can view own queue items" ON visitor_registration_queue;

-- 3. Criar política PÚBLICA para a fila (temporário para testes)
CREATE POLICY "Allow public queue creation" ON visitor_registration_queue
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public queue reading" ON visitor_registration_queue
    FOR SELECT 
    USING (true);

-- 4. Verificar se funcionou
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'visitor_registration_queue';

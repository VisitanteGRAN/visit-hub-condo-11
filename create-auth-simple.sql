-- Método mais simples para criar usuário no auth
-- Execute no SQL Editor do Supabase

-- Usar a função signup do Supabase
SELECT auth.signup(
    'admingran1@condominio.com',
    'Gran123456!',
    '{}',
    '{}'::jsonb
);

-- Confirmar email automaticamente
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'admingran1@condominio.com'
AND email_confirmed_at IS NULL;

-- Verificar se foi criado
SELECT 
    id, 
    email, 
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'admingran1@condominio.com';

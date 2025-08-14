-- Criar usuário admin para teste
-- Execute este script após corrigir as políticas RLS

-- Primeiro, vamos inserir um usuário admin diretamente
INSERT INTO usuarios (
    id,
    nome,
    email,
    perfil,
    unidade,
    ativo,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(), -- Gera UUID válido automaticamente
    'Administrador Teste',
    'admin@teste.com',
    'admin',
    'ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verificar se foi inserido
SELECT * FROM usuarios WHERE perfil = 'admin';

-- Agora você pode fazer login com:
-- Email: admin@teste.com
-- Senha: (será definida pelo Supabase Auth)
-- Role: admin 
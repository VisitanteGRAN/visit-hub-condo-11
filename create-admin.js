const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://rnpgtwughapxxvvckepd.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAzMzUzOSwiZXhwIjoyMDcwNjA5NTM5fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"; // Você precisa da service key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createAdminUser() {
  try {
    console.log('🔐 Criando usuário admin...');
    
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@condominio.com.br',
      password: 'Admin@123456',
      email_confirm: true,
      user_metadata: {
        nome: 'Administrador Sistema',
        perfil: 'admin',
        unidade: 'ADMIN'
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError);
      return;
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id);

    // 2. Inserir na tabela usuarios
    const { data: profileData, error: profileError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: 'admin@condominio.com.br',
        nome: 'Administrador Sistema',
        perfil: 'admin',
        unidade: 'ADMIN',
        ativo: true,
        supabase_user_id: authData.user.id
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError);
      return;
    }

    console.log('✅ Perfil criado:', profileData);
    console.log('🎉 Usuário admin criado com sucesso!');
    console.log('📧 Email: admin@condominio.com.br');
    console.log('🔑 Senha: Admin@123456');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createAdminUser(); 
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://rnpgtwughapxxvvckepd.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDQ2NzI5NSwiZXhwIjoyMDUwMDQzMjk1fQ.MqrVCOBY5sELkJZ5q6wqCGfmIZgBHwdtGxKPPSGRAjg'; 

// Cliente Supabase com service role
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixSupabaseUsers() {
  console.log('🔧 Corrigindo usuários do Supabase...\n');

  try {
    // 1. Criar usuário admin
    console.log('👤 Criando usuário admin...');
    const adminResult = await supabase.auth.admin.createUser({
      email: 'admin@condominio.com.br',
      password: 'Admin@123456',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'Administrador'
      }
    });

    if (adminResult.error) {
      console.log('⚠️ Admin já existe ou erro:', adminResult.error.message);
    } else {
      console.log('✅ Admin criado:', adminResult.data.user.email);
      
      // Inserir perfil admin na tabela usuarios
      const { error: profileError } = await supabase
        .from('usuarios')
        .upsert({
          id: adminResult.data.user.id,
          email: 'admin@condominio.com.br',
          senha_hash: '',
          nome: 'Administrador',
          perfil: 'admin',
          unidade: 'Administração',
          ativo: true
        });
        
      if (profileError) {
        console.log('⚠️ Erro ao criar perfil admin:', profileError.message);
      } else {
        console.log('✅ Perfil admin criado na tabela usuarios');
      }
    }

    // 2. Criar usuário morador
    console.log('\n👥 Criando usuário morador...');
    const moradorResult = await supabase.auth.admin.createUser({
      email: 'morador@condominio.com.br',
      password: 'Morador@123456',
      email_confirm: true,
      user_metadata: {
        role: 'morador',
        name: 'Morador Teste'
      }
    });

    if (moradorResult.error) {
      console.log('⚠️ Morador já existe ou erro:', moradorResult.error.message);
    } else {
      console.log('✅ Morador criado:', moradorResult.data.user.email);
      
      // Inserir perfil morador na tabela usuarios
      const { error: profileError } = await supabase
        .from('usuarios')
        .upsert({
          id: moradorResult.data.user.id,
          email: 'morador@condominio.com.br',
          senha_hash: '',
          nome: 'Morador Teste',
          perfil: 'morador',
          unidade: 'Apto 101',
          ativo: true
        });
        
      if (profileError) {
        console.log('⚠️ Erro ao criar perfil morador:', profileError.message);
      } else {
        console.log('✅ Perfil morador criado na tabela usuarios');
      }
    }

    // 3. Listar e confirmar todos os usuários
    console.log('\n📋 Confirmando todos os usuários...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return;
    }

    for (const user of users.users) {
      if (!user.email_confirmed_at) {
        console.log(`📧 Confirmando email: ${user.email}`);
        
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.log(`❌ Erro ao confirmar ${user.email}:`, confirmError.message);
        } else {
          console.log(`✅ Email confirmado: ${user.email}`);
        }
      } else {
        console.log(`✅ ${user.email} já confirmado`);
      }
    }

    console.log('\n🎉 USUÁRIOS CONFIGURADOS COM SUCESSO!');
    console.log('=====================================');
    console.log('👤 Admin: admin@condominio.com.br | Admin@123456');
    console.log('🏠 Morador: morador@condominio.com.br | Morador@123456');
    console.log('\n🚀 Agora você pode fazer login no sistema!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar correção
fixSupabaseUsers(); 
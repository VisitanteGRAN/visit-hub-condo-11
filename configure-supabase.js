const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://rnpgtwughapxxvvckepd.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAzMzUzOSwiZXhwIjoyMDcwNjA5NTM5fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"; // Você precisa da service key real

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function configureSupabase() {
  try {
    console.log('🔧 Configurando Supabase...');
    
    // 1. Confirmar todos os usuários pendentes
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError);
      return;
    }

    console.log(`📧 Encontrados ${users.users.length} usuários`);
    
    // Confirmar usuários não confirmados
    for (const user of users.users) {
      if (!user.email_confirmed_at) {
        console.log(`📧 Confirmando email de: ${user.email}`);
        
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.error(`❌ Erro ao confirmar ${user.email}:`, confirmError);
        } else {
          console.log(`✅ Email confirmado para: ${user.email}`);
        }
      }
    }
    
    console.log('🎉 Configuração concluída!');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
  }
}

configureSupabase(); 
import { createClient } from '@supabase/supabase-js';

// Teste direto das configurações do Supabase
export const testSupabaseConfig = () => {
  console.log('🧪 TESTE SUPABASE ADMIN CONFIG');
  console.log('===============================');
  
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📍 URL:', url);
  console.log('🔑 Anon Key disponível:', !!anonKey);
  console.log('🔐 Service Key disponível:', !!serviceKey);
  
  if (!serviceKey) {
    console.error('❌ PROBLEMA: VITE_SUPABASE_SERVICE_ROLE_KEY não carregada!');
    return null;
  }
  
  // Criar cliente de teste com service key - FORÇAR HEADERS
  const testClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'apikey': serviceKey,
        'authorization': `Bearer ${serviceKey}`,
        'content-type': 'application/json',
        'prefer': 'return=representation'
      }
    },
    // Configuração adicional para forçar uso da service key
    db: {
      schema: 'public'
    }
  });
  
  console.log('✅ Cliente teste criado com service key');
  return testClient;
};

// Testar consulta direta
export const testUsuariosQuery = async (email: string) => {
  console.log('🧪 TESTANDO CONSULTA USUARIOS');
  console.log('============================');
  
  const client = testSupabaseConfig();
  if (!client) {
    console.error('❌ Cliente não criado');
    return;
  }
  
  try {
    console.log(`🔍 Consultando usuário: ${email}`);
    const { data, error } = await client
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('❌ Erro na consulta:', error);
    } else {
      console.log('✅ Usuário encontrado:', data);
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    return { data: null, error: err };
  }
};

// Teste com fetch direto (bypass do cliente JS)
export const testDirectFetch = async (email: string) => {
  console.log('🧪 TESTANDO FETCH DIRETO');
  console.log('=======================');
  
  const url = import.meta.env.VITE_SUPABASE_URL;
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    console.error('❌ Service key não encontrada');
    return;
  }
  
  try {
    const apiUrl = `${url}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}&select=*`;
    console.log('🌐 URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'authorization': `Bearer ${serviceKey}`,
        'content-type': 'application/json',
        'accept': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro fetch:', response.status, errorText);
      return { data: null, error: errorText };
    }
    
    const data = await response.json();
    console.log('✅ Fetch direto sucesso:', data);
    return { data, error: null };
    
  } catch (err) {
    console.error('❌ Erro fetch direto:', err);
    return { data: null, error: err };
  }
};

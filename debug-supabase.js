// Teste direto das variáveis
console.log('=== TESTE DIRETO VARIÁVEIS ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'PRESENTE' : 'FALTANDO');
console.log('VITE_SUPABASE_SERVICE_KEY:', import.meta.env.VITE_SUPABASE_SERVICE_KEY ? 'PRESENTE' : 'FALTANDO');

// Teste direto das funções
try {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
  
  console.log('URL disponível:', !!url);
  console.log('Service Key disponível:', !!serviceKey);
  
  if (!serviceKey) {
    console.error('❌ SERVICE KEY NÃO ENCONTRADA!');
    console.log('Variáveis disponíveis:', Object.keys(import.meta.env));
  } else {
    console.log('✅ SERVICE KEY ENCONTRADA!');
  }
} catch (error) {
  console.error('Erro no teste:', error);
}

// Script para criar usuário via API do Supabase
// Execute no console do navegador ou Node.js

// 1. Substitua YOUR_PROJECT_URL e YOUR_SERVICE_ROLE_KEY
const SUPABASE_URL = 'https://rnpgtwughapxxvvckepd.supabase.co'
const SERVICE_ROLE_KEY = 'SEU_SERVICE_ROLE_KEY_AQUI' // Pegue do Supabase Dashboard → Settings → API

// 2. Criar usuário
fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY
  },
  body: JSON.stringify({
    email: 'admingran1@condominio.com',
    password: 'Gran123456!',
    email_confirm: true,
    user_metadata: {
      nome: 'Administrador Gran Royalle'
    }
  })
})
.then(response => response.json())
.then(data => console.log('Usuário criado:', data))
.catch(error => console.error('Erro:', error));

console.log('Script executado. Verifique o resultado acima.');

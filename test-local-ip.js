import axios from 'axios';

const HIKCENTRAL_LOCAL = {
  baseUrl: 'http://192.168.1.200',
  httpsUrl: 'https://192.168.1.200',
  username: 'luca',
  password: 'Luca123#',
  timeout: 10000
};

async function testLocalIP() {
  console.log('🔍 Testando IP local do HikCentral...');
  console.log('📍 IP Local:', HIKCENTRAL_LOCAL.baseUrl);
  console.log('👤 Usuário:', HIKCENTRAL_LOCAL.username);
  
  // URLs para testar
  const urls = [
    `${HIKCENTRAL_LOCAL.baseUrl}:80`,
    `${HIKCENTRAL_LOCAL.baseUrl}:443`,
    `${HIKCENTRAL_LOCAL.httpsUrl}:443`,
    `${HIKCENTRAL_LOCAL.baseUrl}:15310`,
    `${HIKCENTRAL_LOCAL.baseUrl}:15443`,
    HIKCENTRAL_LOCAL.baseUrl // Porta padrão
  ];

  // Endpoints para testar
  const endpoints = [
    '/',
    '/login',
    '/api',
    '/openapi',
    '/artemis/api',
    '/ISAPI',
    '/ISAPI/System/deviceInfo',
    '/ISAPI/AccessControl/UserInfo/Count',
    '/doc',
    '/swagger'
  ];

  for (const baseUrl of urls) {
    console.log(`\n🚪 Testando: ${baseUrl}`);
    
    for (const endpoint of endpoints) {
      try {
        console.log(`  🔍 ${endpoint}`);
        
        const response = await axios.get(`${baseUrl}${endpoint}`, {
          auth: {
            username: HIKCENTRAL_LOCAL.username,
            password: HIKCENTRAL_LOCAL.password
          },
          timeout: 5000,
          validateStatus: () => true,
          httpsAgent: new (await import('https')).Agent({
            rejectUnauthorized: false // Para HTTPS auto-assinado
          })
        });
        
        console.log(`    ✅ Status: ${response.status}`);
        
        if (response.status === 200) {
          console.log(`    🎉 SUCESSO: ${baseUrl}${endpoint}`);
          console.log(`    📊 Content-Type: ${response.headers['content-type']}`);
          
          if (response.headers['content-type']?.includes('json')) {
            console.log(`    📋 JSON:`, JSON.stringify(response.data, null, 2));
          } else if (response.headers['content-type']?.includes('html')) {
            console.log(`    📋 HTML (interface web encontrada)`);
            
            // Procurar indicações de API
            const html = response.data.toString();
            const apiHints = ['artemis', 'openapi', 'swagger', 'isapi', 'api', 'json', 'rest'];
            const found = apiHints.filter(hint => html.toLowerCase().includes(hint));
            
            if (found.length > 0) {
              console.log(`    🎯 APIs encontradas: ${found.join(', ')}`);
            }
          }
          
          // Se encontrou uma API, não precisa testar mais endpoints nesta URL
          break;
          
        } else if (response.status === 401) {
          console.log(`    🔐 Requer autenticação (API disponível)`);
        } else if (response.status === 403) {
          console.log(`    🚫 Acesso negado`);
        } else if (response.status === 404) {
          console.log(`    ❌ Não encontrado`);
        } else {
          console.log(`    ⚠️ Status: ${response.status}`);
        }
        
      } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          console.log(`    🚫 Conexão recusada/não encontrada`);
          break; // Não testar mais endpoints nesta URL
        } else if (error.code === 'ETIMEDOUT') {
          console.log(`    ⏰ Timeout`);
        } else if (error.code === 'ECONNRESET') {
          console.log(`    🔌 Conexão resetada`);
        } else {
          console.log(`    ❌ ${error.message}`);
        }
      }
    }
  }
  
  console.log('\n📋 Teste específico: Portas ISUP');
  
  // Testar portas ISUP específicas
  const isupPorts = [7332, 7334, 15300, 15310, 15443, 8555, 7660, 7661, 16000, 16001, 16003];
  
  for (const port of isupPorts) {
    try {
      console.log(`🔍 Testando porta ISUP: ${port}`);
      
      const response = await axios.get(`http://192.168.1.200:${port}`, {
        timeout: 3000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        console.log(`  🎉 Porta ${port} respondeu!`);
        console.log(`  📊 Resposta:`, response.data);
      }
      
    } catch (error) {
      console.log(`  ❌ Porta ${port}: ${error.message.substring(0, 50)}`);
    }
  }
  
  console.log('\n💡 Resultado: ');
  console.log('  Se encontrou APIs, podemos integrar diretamente');
  console.log('  Se não, precisamos habilitar o Hik-ProConnect');
}

testLocalIP(); 
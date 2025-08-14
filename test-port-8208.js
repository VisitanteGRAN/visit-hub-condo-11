import axios from 'axios';

const HIKCENTRAL_CONFIG = {
  baseUrl: 'http://45.4.132.189:8208',
  username: 'luca',
  password: 'Luca123#',
  timeout: 10000
};

async function testPort8208() {
  console.log('🔍 Testando especificamente a porta 8208...');
  console.log('📍 URL:', HIKCENTRAL_CONFIG.baseUrl);
  console.log('👤 Usuário:', HIKCENTRAL_CONFIG.username);
  
  const endpoints = [
    // Endpoints comuns para HikCentral
    '/',
    '/api',
    '/openapi',
    '/artemis',
    '/artemis/api',
    '/artemis/api/acs/v1',
    '/artemis/api/resource/v1',
    '/ISAPI',
    '/doc',
    '/swagger',
    '/login',
    '/status',
    '/health',
    '/version'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testando: ${endpoint}`);
      
      const response = await axios.get(`${HIKCENTRAL_CONFIG.baseUrl}${endpoint}`, {
        auth: {
          username: HIKCENTRAL_CONFIG.username,
          password: HIKCENTRAL_CONFIG.password
        },
        timeout: 5000,
        validateStatus: () => true // Aceitar qualquer status
      });
      
      console.log(`  ✅ Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`  🎉 SUCESSO: ${endpoint}`);
        console.log(`  📊 Content-Type: ${response.headers['content-type']}`);
        
        // Se for JSON, mostrar estrutura
        if (response.headers['content-type']?.includes('json')) {
          console.log(`  📋 Resposta JSON:`, response.data);
        } else if (response.headers['content-type']?.includes('html')) {
          console.log(`  📋 HTML encontrado (interface web)`);
          
          // Procurar por indicações de API
          const html = response.data.toString();
          const apiHints = ['artemis', 'openapi', 'swagger', 'api', 'json', 'rest'];
          const found = apiHints.filter(hint => html.toLowerCase().includes(hint));
          
          if (found.length > 0) {
            console.log(`  🎯 Indicações de API: ${found.join(', ')}`);
          }
        } else {
          console.log(`  📋 Resposta:`, response.data.substring(0, 200) + '...');
        }
        
      } else if (response.status === 401) {
        console.log(`  🔐 Requer autenticação (API disponível)`);
      } else if (response.status === 403) {
        console.log(`  🚫 Acesso negado (mas endpoint existe)`);
      } else if (response.status === 404) {
        console.log(`  ❌ Não encontrado`);
      } else {
        console.log(`  ⚠️ Status: ${response.status}`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`  🚫 Conexão recusada`);
        break;
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`  ⏰ Timeout`);
      } else {
        console.log(`  ❌ Erro: ${error.message}`);
      }
    }
  }
  
  console.log('\n🔧 Testando endpoints específicos de acesso...');
  
  // Testar endpoints específicos baseados na documentação
  const specificEndpoints = [
    '/artemis/api/acs/v1/person/advance/personList',
    '/artemis/api/acs/v1/person',
    '/artemis/api/resource/v1/person/personList',
    '/artemis/api/system/v1/login',
    '/api/v1/login',
    '/openapi/login'
  ];
  
  for (const endpoint of specificEndpoints) {
    try {
      console.log(`🎯 Testando endpoint específico: ${endpoint}`);
      
      const response = await axios.post(`${HIKCENTRAL_CONFIG.baseUrl}${endpoint}`, {
        userName: HIKCENTRAL_CONFIG.username,
        password: HIKCENTRAL_CONFIG.password
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      });
      
      console.log(`  ✅ Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`  🎉 SUCESSO LOGIN: ${endpoint}`);
        console.log(`  📊 Resposta:`, response.data);
      }
      
    } catch (error) {
      console.log(`  ❌ ${endpoint}: ${error.message}`);
    }
  }
}

testPort8208(); 
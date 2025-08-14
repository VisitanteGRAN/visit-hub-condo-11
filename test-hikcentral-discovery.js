import axios from 'axios';

const HIKCENTRAL_CONFIG = {
  baseUrl: 'http://45.4.132.189',
  username: 'luca',
  password: 'Luca123#',
  timeout: 10000
};

async function discoverHikCentralAPIs() {
  console.log('🔍 Descobrindo APIs disponíveis no HikCentral...');
  console.log('📍 IP:', HIKCENTRAL_CONFIG.baseUrl);
  console.log('👤 Usuário:', HIKCENTRAL_CONFIG.username);
  
  // Portas comuns do HikCentral
  const commonPorts = [80, 443, 8080, 8443, 8000, 8008, 8208, 3000, 3001];
  
  // Endpoints comuns para diferentes APIs
  const apiEndpoints = {
    'OpenAPI v3': [
      '/artemis/api/resource/v1/person/personList',
      '/artemis/api/acs/v1/person',
      '/openapi/v1/person',
      '/api/v1/person'
    ],
    'OpenAPI v2': [
      '/artemis/api/resource/v2/person/personList',
      '/artemis/api/acs/v2/person'
    ],
    'ISAPI': [
      '/ISAPI/AccessControl/UserInfo/Count',
      '/ISAPI/AccessControl/UserInfo/Search',
      '/ISAPI/System/deviceInfo'
    ],
    'Web Interface': [
      '/login',
      '/doc/page/login.asp',
      '/home',
      '/index.html'
    ]
  };

  for (const port of commonPorts) {
    console.log(`\n🚪 Testando porta ${port}...`);
    
    const baseUrl = `${HIKCENTRAL_CONFIG.baseUrl}:${port}`;
    
    // Testar cada tipo de API
    for (const [apiType, endpoints] of Object.entries(apiEndpoints)) {
      console.log(`  📡 Testando ${apiType}...`);
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${baseUrl}${endpoint}`, {
            auth: {
              username: HIKCENTRAL_CONFIG.username,
              password: HIKCENTRAL_CONFIG.password
            },
            timeout: 5000,
            validateStatus: () => true // Aceitar qualquer status HTTP
          });
          
          console.log(`    ✅ ${endpoint} → Status: ${response.status}`);
          
          if (response.status === 200) {
            console.log(`    🎉 API ENCONTRADA: ${apiType} na porta ${port}`);
            console.log(`    📊 Resposta:`, response.data);
            
            return {
              apiType,
              port,
              endpoint,
              baseUrl: `${baseUrl}`,
              response: response.data
            };
          } else if (response.status === 401) {
            console.log(`    🔐 ${endpoint} → Requer autenticação (API disponível)`);
          } else if (response.status === 404) {
            console.log(`    ❌ ${endpoint} → Não encontrado`);
          } else {
            console.log(`    ⚠️ ${endpoint} → Status: ${response.status}`);
          }
          
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            console.log(`    🚫 Porta ${port} fechada`);
            break; // Não testar mais endpoints nesta porta
          } else if (error.code === 'ETIMEDOUT') {
            console.log(`    ⏰ ${endpoint} → Timeout`);
          } else {
            console.log(`    ❌ ${endpoint} → ${error.message}`);
          }
        }
      }
    }
  }
  
  console.log('\n🔍 Teste adicional: Verificando interface web...');
  
  // Testar interface web para ver informações
  try {
    const webResponse = await axios.get(`${HIKCENTRAL_CONFIG.baseUrl}`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`📋 Interface web → Status: ${webResponse.status}`);
    
    if (webResponse.data) {
      const html = webResponse.data.toString();
      
      // Procurar por indicações de API na página
      const apiHints = [
        'artemis', 'openapi', 'isapi', 'restful', 'json', 'api'
      ];
      
      const foundHints = apiHints.filter(hint => 
        html.toLowerCase().includes(hint)
      );
      
      if (foundHints.length > 0) {
        console.log(`🎯 Indicações de API encontradas: ${foundHints.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Interface web → ${error.message}`);
  }
  
  console.log('\n📋 Resumo: Nenhuma API padrão encontrada.');
  console.log('💡 Próximos passos:');
  console.log('   1. Verificar documentação do HikCentral');
  console.log('   2. Verificar configurações de API no sistema');
  console.log('   3. Baixar SDK oficial da Hikvision');
}

discoverHikCentralAPIs(); 
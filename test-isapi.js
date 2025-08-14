import axios from 'axios';

// Configuração da ISAPI HikCentral
const ISAPI_CONFIG = {
  baseUrl: 'http://45.4.132.189',
  username: 'luca',
  password: 'Luca123#',
  timeout: 30000
};

async function testISAPI() {
  console.log('🔍 Testando ISAPI do HikCentral...');
  console.log('📍 URL:', ISAPI_CONFIG.baseUrl);
  console.log('👤 Usuário:', ISAPI_CONFIG.username);
  
  try {
    // 1. Testar conexão básica
    console.log('\n1️⃣ Testando conexão básica...');
    const response = await axios.get(`${ISAPI_CONFIG.baseUrl}/ISAPI/System/deviceInfo`, {
      auth: {
        username: ISAPI_CONFIG.username,
        password: ISAPI_CONFIG.password
      },
      timeout: ISAPI_CONFIG.timeout
    });
    
    console.log('✅ Conexão ISAPI bem-sucedida!');
    console.log('📊 Resposta:', response.data);
    
    // 2. Testar listagem de dispositivos
    console.log('\n2️⃣ Testando listagem de dispositivos...');
    const devicesResponse = await axios.get(`${ISAPI_CONFIG.baseUrl}/ISAPI/Device/list`, {
      auth: {
        username: ISAPI_CONFIG.username,
        password: ISAPI_CONFIG.password
      },
      timeout: ISAPI_CONFIG.timeout
    });
    
    console.log('✅ Dispositivos encontrados!');
    console.log('📊 Dispositivos:', devicesResponse.data);
    
    // 3. Testar criação de usuário
    console.log('\n3️⃣ Testando criação de usuário...');
    const testUser = {
      userName: 'Teste Visitante ISAPI',
      cardNo: 'TEST002',
      userType: 'visitor',
      phoneNumber: '11999999999',
      email: 'teste@exemplo.com'
    };
    
    const userResponse = await axios.post(`${ISAPI_CONFIG.baseUrl}/ISAPI/User/create`, testUser, {
      auth: {
        username: ISAPI_CONFIG.username,
        password: ISAPI_CONFIG.password
      },
      timeout: ISAPI_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('📊 Resposta:', userResponse.data);
    
  } catch (error) {
    console.error('❌ Erro na ISAPI:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Dados:', error.response.data);
    }
    
    // Tentar endpoints alternativos
    console.log('\n🔄 Tentando endpoints alternativos...');
    
    const alternativeEndpoints = [
      '/ISAPI/System/info',
      '/ISAPI/System/status',
      '/ISAPI/Device/info',
      '/ISAPI/User/info',
      '/ISAPI/System/deviceInfo',
      '/ISAPI/System/deviceInfo?format=json'
    ];
    
    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`🔍 Testando: ${endpoint}`);
        const altResponse = await axios.get(`${ISAPI_CONFIG.baseUrl}${endpoint}`, {
          auth: {
            username: ISAPI_CONFIG.username,
            password: ISAPI_CONFIG.password
          },
          timeout: 5000
        });
        
        console.log(`✅ ${endpoint} funcionou!`);
        console.log('📊 Resposta:', altResponse.data);
        break;
      } catch (altError) {
        console.log(`❌ ${endpoint} falhou:`, altError.message);
      }
    }
  }
}

testISAPI(); 
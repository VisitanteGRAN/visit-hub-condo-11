import axios from 'axios';

// Configuração da API HikCentral
const HIKCENTRAL_CONFIG = {
  baseUrl: 'http://45.4.132.189:8208',
  username: 'luca',
  password: 'Luca123#',
  timeout: 30000
};

async function testHikCentralAPI() {
  console.log('🔍 Testando API do HikCentral...');
  console.log('📍 URL:', HIKCENTRAL_CONFIG.baseUrl);
  console.log('👤 Usuário:', HIKCENTRAL_CONFIG.username);
  
  try {
    // 1. Testar conexão básica
    console.log('\n1️⃣ Testando conexão básica...');
    const response = await axios.get(`${HIKCENTRAL_CONFIG.baseUrl}/api/system/deviceInfo`, {
      auth: {
        username: HIKCENTRAL_CONFIG.username,
        password: HIKCENTRAL_CONFIG.password
      },
      timeout: HIKCENTRAL_CONFIG.timeout
    });
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Resposta:', response.data);
    
    // 2. Testar listagem de dispositivos
    console.log('\n2️⃣ Testando listagem de dispositivos...');
    const devicesResponse = await axios.get(`${HIKCENTRAL_CONFIG.baseUrl}/api/device/list`, {
      auth: {
        username: HIKCENTRAL_CONFIG.username,
        password: HIKCENTRAL_CONFIG.password
      },
      timeout: HIKCENTRAL_CONFIG.timeout
    });
    
    console.log('✅ Dispositivos encontrados!');
    console.log('📊 Dispositivos:', devicesResponse.data);
    
    // 3. Testar criação de usuário
    console.log('\n3️⃣ Testando criação de usuário...');
    const testUser = {
      userName: 'Teste Visitante',
      cardNo: 'TEST001',
      userType: 'visitor',
      phoneNumber: '11999999999',
      email: 'teste@exemplo.com'
    };
    
    const userResponse = await axios.post(`${HIKCENTRAL_CONFIG.baseUrl}/api/user/create`, testUser, {
      auth: {
        username: HIKCENTRAL_CONFIG.username,
        password: HIKCENTRAL_CONFIG.password
      },
      timeout: HIKCENTRAL_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('📊 Resposta:', userResponse.data);
    
  } catch (error) {
    console.error('❌ Erro na API:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Dados:', error.response.data);
    }
    
    // Tentar endpoints alternativos
    console.log('\n🔄 Tentando endpoints alternativos...');
    
    const alternativeEndpoints = [
      '/api/system/info',
      '/api/system/status',
      '/api/device/info',
      '/api/user/info'
    ];
    
    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`🔍 Testando: ${endpoint}`);
        const altResponse = await axios.get(`${HIKCENTRAL_CONFIG.baseUrl}${endpoint}`, {
          auth: {
            username: HIKCENTRAL_CONFIG.username,
            password: HIKCENTRAL_CONFIG.password
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

testHikCentralAPI(); 
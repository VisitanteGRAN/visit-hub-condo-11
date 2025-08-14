import axios from 'axios';

const CREDENTIALS = {
  username: 'luca',
  password: 'Luca123#',
  timeout: 10000
};

// IPs dos coletores que vimos na imagem
const COLLECTORS = [
  { name: 'Entrada_Visitante_2', ip: '192.168.1.205' },
  { name: 'Entrada Caminhão Alto', ip: '192.168.1.204' },
  { name: 'Saída Catraca Prestador', ip: '192.168.1.206' },
  { name: 'Saída Caminhão Baixo', ip: '192.168.1.207' },
  { name: 'Saída Proprietario', ip: '192.168.1.208' },
  { name: 'Saída_Caminhao_Alto', ip: '192.168.1.209' },
  { name: 'Entrada Catraca Prestador', ip: '192.168.1.210' },
  { name: 'Entrada Clube', ip: '192.168.1.211' },
  { name: 'Saída Clube', ip: '192.168.1.212' },
  { name: 'Academia', ip: '192.168.1.213' }
];

async function testCollector(collector) {
  console.log(`\n🔍 Testando: ${collector.name} (${collector.ip})`);
  
  const baseUrl = `http://${collector.ip}`;
  
  // URLs para testar
  const endpoints = [
    '/ISAPI/System/deviceInfo',
    '/ISAPI/System/status',
    '/ISAPI/AccessControl/UserInfo/Count',
    '/ISAPI/AccessControl/UserInfo/Search',
    '/ISAPI/AccessControl/Door/Status',
    '/ISAPI/Security/users',
    '/cgi-bin/configManager.cgi?action=getConfig&name=AccessControl',
    '/',
    '/doc'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`  🔍 ${endpoint}`);
      
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        auth: {
          username: CREDENTIALS.username,
          password: CREDENTIALS.password
        },
        timeout: 5000,
        validateStatus: () => true
      });
      
      console.log(`    ✅ Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`    🎉 SUCESSO: ${collector.name}${endpoint}`);
        console.log(`    📊 Content-Type: ${response.headers['content-type']}`);
        
        if (response.headers['content-type']?.includes('json')) {
          console.log(`    📋 JSON:`, JSON.stringify(response.data, null, 2));
        } else if (response.headers['content-type']?.includes('xml')) {
          console.log(`    📋 XML:`, response.data.toString().substring(0, 500) + '...');
        } else if (response.headers['content-type']?.includes('html')) {
          console.log(`    📋 HTML (interface web encontrada)`);
        } else {
          console.log(`    📋 Resposta:`, response.data.toString().substring(0, 200) + '...');
        }
        
        // Se encontrou uma API, parar de testar mais endpoints
        return { success: true, endpoint, data: response.data };
        
      } else if (response.status === 401) {
        console.log(`    🔐 Requer autenticação (credenciais incorretas?)`);
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
        return { success: false, error: 'connection_refused' };
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`    ⏰ Timeout`);
      } else if (error.code === 'ECONNRESET') {
        console.log(`    🔌 Conexão resetada`);
      } else {
        console.log(`    ❌ ${error.message}`);
      }
    }
  }
  
  return { success: false, error: 'no_working_endpoint' };
}

async function testAllCollectors() {
  console.log('🎯 Testando conectividade com todos os coletores DS-K1T671MF...');
  console.log(`👤 Usuário: ${CREDENTIALS.username}`);
  console.log(`🔑 Senha: ${CREDENTIALS.password}`);
  
  const results = [];
  
  for (const collector of COLLECTORS) {
    const result = await testCollector(collector);
    results.push({
      collector,
      ...result
    });
  }
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('=====================');
  
  const working = results.filter(r => r.success);
  const notWorking = results.filter(r => !r.success);
  
  if (working.length > 0) {
    console.log(`\n✅ COLETORES FUNCIONANDO (${working.length}):`);
    working.forEach(r => {
      console.log(`  🎉 ${r.collector.name} (${r.collector.ip}) - ${r.endpoint}`);
    });
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('  1. Implementar API para cadastro de usuários');
    console.log('  2. Testar criação de visitantes');
    console.log('  3. Integrar com o sistema web');
    
  } else {
    console.log(`\n❌ NENHUM COLETOR RESPONDEU`);
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('  1. Verificar se você está na mesma rede (192.168.1.x)');
    console.log('  2. Confirmar usuário e senha nos coletores');
    console.log('  3. Verificar se a API ISAPI está habilitada');
    console.log('  4. Testar com usuário admin do HikCentral');
  }
  
  return results;
}

testAllCollectors(); 
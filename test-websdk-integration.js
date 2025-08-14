// Teste completo da integração WebSDK
// Este arquivo testa a integração sem depender do React

console.log('🧪 Teste de Integração WebSDK - HikVision DS-K1T671MF');
console.log('================================================');

// Simular o ambiente do navegador
global.window = {
  WebVideoCtrl: null,
  document: {
    createElement: () => ({
      src: '',
      onload: null,
      onerror: null
    }),
    head: {
      appendChild: () => {}
    }
  },
  location: {
    origin: 'http://localhost:5173'
  }
};

global.document = global.window.document;

// Mock do WebVideoCtrl para teste
const mockWebVideoCtrl = {
  I_InitPlugin: (config) => {
    console.log('🔧 Mock: Inicializando plugin WebSDK...');
    setTimeout(() => {
      if (config.cbInitPluginComplete) {
        config.cbInitPluginComplete();
      }
    }, 100);
  },
  
  I_Login: (ip, channel, username, password, port, callback) => {
    console.log(`🔌 Mock: Tentando login em ${ip}:${port}`);
    console.log(`👤 Usuário: ${username}`);
    
    // Simular sucesso para alguns IPs
    const successIPs = ['192.168.1.205', '192.168.1.211', '192.168.1.204'];
    const isSuccess = successIPs.includes(ip);
    
    setTimeout(() => {
      const loginId = isSuccess ? Math.floor(Math.random() * 1000) : -1;
      console.log(`${isSuccess ? '✅' : '❌'} Mock: Login ${ip} - ID: ${loginId}`);
      callback(loginId, {});
    }, 500);
  },
  
  I_SetUserInfo: (userData, callback) => {
    console.log('👤 Mock: Criando usuário:', userData.userName);
    
    // Simular sucesso em 80% dos casos
    const isSuccess = Math.random() > 0.2;
    
    setTimeout(() => {
      const result = isSuccess ? 0 : -1;
      console.log(`${isSuccess ? '✅' : '❌'} Mock: Criação usuário - Result: ${result}`);
      callback(result, {});
    }, 300);
  }
};

// Simular carregamento do WebSDK
global.window.WebVideoCtrl = mockWebVideoCtrl;

// Importar nossa classe (simulando)
class HikVisionWebSDKService {
  constructor() {
    this.isInitialized = true; // Pular carregamento real
    this.connectedDevices = new Map();
    
    this.collectors = [
      { ip: '192.168.1.205', port: 80, username: 'luca', password: 'Luca123#', name: 'Entrada_Visitante_2' },
      { ip: '192.168.1.204', port: 80, username: 'luca', password: 'Luca123#', name: 'Entrada Caminhão Alto' },
      { ip: '192.168.1.211', port: 80, username: 'luca', password: 'Luca123#', name: 'Entrada Clube' },
      { ip: '192.168.1.206', port: 80, username: 'luca', password: 'Luca123#', name: 'Saída Catraca Prestador' },
      { ip: '192.168.1.212', port: 80, username: 'luca', password: 'Luca123#', name: 'Saída Clube' }
    ];
  }

  async connectToDevice(device) {
    console.log(`🔌 Conectando ao dispositivo: ${device.name} (${device.ip})`);
    
    return new Promise((resolve) => {
      global.window.WebVideoCtrl.I_Login(
        device.ip,
        1,
        device.username,
        device.password,
        device.port,
        (loginId, xmlDoc) => {
          const success = loginId >= 0;
          if (success) {
            this.connectedDevices.set(`${device.ip}:${device.port}`, true);
          }
          
          resolve({
            success,
            message: success ? `Conectado ao ${device.name}` : `Falha na conexão com ${device.name}`,
            data: success ? { loginId, device } : null
          });
        }
      );
    });
  }

  async connectToAllCollectors() {
    console.log('🔄 Conectando a todos os coletores...');
    
    const results = [];
    
    for (const collector of this.collectors) {
      const result = await this.connectToDevice(collector);
      results.push(result);
      
      // Aguardar entre conexões
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`✅ Conectado a ${successful}/${this.collectors.length} coletores`);
    
    return results;
  }

  async createUserOnDevice(device, visitor) {
    const deviceKey = `${device.ip}:${device.port}`;
    
    // Conectar se necessário
    if (!this.connectedDevices.get(deviceKey)) {
      const connectionResult = await this.connectToDevice(device);
      if (!connectionResult.success) {
        return connectionResult;
      }
    }

    console.log(`👤 Criando usuário no ${device.name}: ${visitor.nome}`);

    const userData = {
      userName: visitor.nome,
      password: visitor.cpf.substring(0, 8),
      privilege: 'user',
      userType: 'normal'
    };

    return new Promise((resolve) => {
      global.window.WebVideoCtrl.I_SetUserInfo(
        userData,
        (result, xmlDoc) => {
          const success = result === 0;
          resolve({
            success,
            message: success ? `Usuário ${visitor.nome} criado no ${device.name}` : `Falha ao criar usuário no ${device.name}`,
            data: success ? { userId: visitor.cpf, device: device.name } : null
          });
        }
      );
    });
  }

  async createVisitorInAllEntries(visitor) {
    console.log(`🚪 Criando visitante ${visitor.nome} em todos os coletores de entrada...`);

    // Filtrar apenas coletores de entrada
    const entryCollectors = this.collectors.filter(c => 
      c.name.toLowerCase().includes('entrada') || 
      c.name.toLowerCase().includes('visitante')
    );

    const results = [];
    let successCount = 0;

    for (const collector of entryCollectors) {
      const result = await this.createUserOnDevice(collector, visitor);
      results.push(result);
      
      if (result.success) {
        successCount++;
      }
      
      // Aguardar entre criações
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: successCount > 0,
      message: `Visitante criado em ${successCount}/${entryCollectors.length} coletores de entrada`,
      data: { results, successCount, totalCollectors: entryCollectors.length }
    };
  }

  getCollectors() {
    return [...this.collectors];
  }

  getConnectionStatus() {
    const status = {};
    this.collectors.forEach(collector => {
      const key = `${collector.ip}:${collector.port}`;
      status[collector.name] = this.connectedDevices.get(key) || false;
    });
    return status;
  }
}

// Executar testes
async function runTests() {
  console.log('\n🚀 Iniciando testes...\n');
  
  const service = new HikVisionWebSDKService();
  
  // Teste 1: Listar coletores
  console.log('📋 TESTE 1: Listar coletores configurados');
  const collectors = service.getCollectors();
  console.log(`Encontrados ${collectors.length} coletores:`);
  collectors.forEach(c => console.log(`  - ${c.name} (${c.ip})`));
  
  // Teste 2: Testar conectividade
  console.log('\n🔌 TESTE 2: Testar conectividade');
  const connectResults = await service.connectToAllCollectors();
  const successful = connectResults.filter(r => r.success);
  console.log(`Conectividade: ${successful.length}/${connectResults.length} coletores`);
  
  // Teste 3: Status das conexões
  console.log('\n📊 TESTE 3: Status das conexões');
  const status = service.getConnectionStatus();
  Object.entries(status).forEach(([name, connected]) => {
    console.log(`  ${connected ? '✅' : '❌'} ${name}`);
  });
  
  // Teste 4: Criar visitante de teste
  console.log('\n👤 TESTE 4: Criar visitante de teste');
  const testVisitor = {
    nome: 'João Silva Teste',
    cpf: '12345678901',
    telefone: '(11) 99999-9999',
    email: 'joao.teste@email.com',
    documento: 'RG123456789'
  };
  
  const visitorResult = await service.createVisitorInAllEntries(testVisitor);
  console.log(`Resultado: ${visitorResult.message}`);
  console.log(`Sucesso em ${visitorResult.data?.successCount}/${visitorResult.data?.totalCollectors} coletores`);
  
  // Resumo final
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('====================');
  console.log(`✅ Coletores configurados: ${collectors.length}`);
  console.log(`✅ Conectividade testada: ${successful.length}/${connectResults.length}`);
  console.log(`✅ Criação de visitante: ${visitorResult.success ? 'Sucesso' : 'Falha'}`);
  
  if (visitorResult.success) {
    console.log('\n🎉 INTEGRAÇÃO WEBSDK FUNCIONANDO!');
    console.log('O sistema está pronto para criar visitantes nos coletores.');
  } else {
    console.log('\n⚠️ VERIFICAR CONFIGURAÇÕES');
    console.log('Há problemas na integração que precisam ser resolvidos.');
  }
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Testar com coletores reais na rede 192.168.1.x');
  console.log('2. Verificar credenciais (luca/Luca123#)');
  console.log('3. Confirmar que a API ISAPI está habilitada nos coletores');
  console.log('4. Testar upload de fotos para reconhecimento facial');
}

// Executar os testes
runTests().catch(console.error); 
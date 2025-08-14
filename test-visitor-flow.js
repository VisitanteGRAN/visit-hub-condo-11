// Teste específico do fluxo de visitantes
console.log('🎯 Teste do Fluxo de Visitantes - Coletores Específicos');
console.log('====================================================');

// Mock para simular o WebSDK
const mockWebVideoCtrl = {
  I_Login: (ip, channel, username, password, port, callback) => {
    console.log(`🔌 Tentando conectar: ${ip}:${port} (${username})`);
    
    // Simular sucesso baseado nos IPs dos coletores de visitantes
    const visitorCollectorIPs = [
      '192.168.1.205', // Entrada Visitante 2
      '192.168.1.210', // Entrada Catraca Prestador  
      '192.168.1.207', // Entrada/Saída Caminhão Baixo
      '192.168.1.206'  // Saída Catraca Prestador
    ];
    
    const isSuccess = visitorCollectorIPs.includes(ip);
    const loginId = isSuccess ? Math.floor(Math.random() * 1000) + 1 : -1;
    
    setTimeout(() => {
      console.log(`${isSuccess ? '✅' : '❌'} Login ${ip} - ID: ${loginId}`);
      callback(loginId, {});
    }, 300);
  },
  
  I_SetUserInfo: (userData, callback) => {
    console.log(`👤 Criando usuário: ${userData.userName}`);
    
    // Simular alta taxa de sucesso para teste
    const isSuccess = Math.random() > 0.1; // 90% sucesso
    const result = isSuccess ? 0 : -1;
    
    setTimeout(() => {
      console.log(`${isSuccess ? '✅' : '❌'} Usuário criado - Result: ${result}`);
      callback(result, {});
    }, 200);
  }
};

// Simulação da classe do serviço
class VisitorFlowTest {
  constructor() {
    this.connectedDevices = new Map();
    
    // APENAS os 5 coletores que os visitantes usam
    this.collectors = [
      // ENTRADAS
      { ip: '192.168.1.205', port: 80, username: 'luca', password: 'Luca123#', name: 'Entrada Visitante 2', type: 'entrada' },
      { ip: '192.168.1.210', port: 80, username: 'luca', password: 'Luca123#', name: 'Entrada Catraca Prestador', type: 'entrada' },
      { ip: '192.168.1.207', port: 80, username: 'luca', password: 'Luca123#', name: 'Entrada Caminhão Baixo', type: 'entrada' },
      
      // SAÍDAS  
      { ip: '192.168.1.207', port: 80, username: 'luca', password: 'Luca123#', name: 'Saída Caminhão Baixo', type: 'saida' },
      { ip: '192.168.1.206', port: 80, username: 'luca', password: 'Luca123#', name: 'Saída Catraca Prestador', type: 'saida' }
    ];
  }

  async connectToDevice(device) {
    console.log(`🔌 Conectando: ${device.name} (${device.ip})`);
    
    return new Promise((resolve) => {
      mockWebVideoCtrl.I_Login(
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

    return new Promise((resolve) => {
      mockWebVideoCtrl.I_SetUserInfo(
        {
          userName: visitor.nome,
          password: visitor.cpf.substring(0, 8),
          privilege: 'user',
          userType: 'normal'
        },
        (result, xmlDoc) => {
          const success = result === 0;
          resolve({
            success,
            message: success ? `Usuário criado no ${device.name}` : `Falha ao criar usuário no ${device.name}`,
            data: success ? { userId: visitor.cpf, device: device.name } : null
          });
        }
      );
    });
  }

  async createVisitorInAllDevices(visitor) {
    console.log(`\n🚪 Criando visitante ${visitor.nome} em TODOS os coletores de acesso...`);

    const results = [];
    let successCount = 0;

    for (const collector of this.collectors) {
      const result = await this.createUserOnDevice(collector, visitor);
      results.push({
        collector: collector.name,
        type: collector.type,
        ip: collector.ip,
        ...result
      });
      
      if (result.success) {
        successCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: successCount > 0,
      message: `Visitante criado em ${successCount}/${this.collectors.length} coletores`,
      data: { results, successCount, totalCollectors: this.collectors.length }
    };
  }

  getEntryCollectors() {
    return this.collectors.filter(c => c.type === 'entrada');
  }

  getExitCollectors() {
    return this.collectors.filter(c => c.type === 'saida');
  }
}

// Executar teste do fluxo completo
async function testVisitorFlow() {
  console.log('\n🚀 INICIANDO TESTE DO FLUXO DE VISITANTES\n');
  
  const service = new VisitorFlowTest();
  
  // Teste 1: Verificar coletores configurados
  console.log('📋 COLETORES CONFIGURADOS:');
  console.log('========================');
  
  const entryCollectors = service.getEntryCollectors();
  const exitCollectors = service.getExitCollectors();
  
  console.log(`\n🚪 ENTRADAS (${entryCollectors.length}):`);
  entryCollectors.forEach(c => console.log(`  - ${c.name} (${c.ip})`));
  
  console.log(`\n🚶 SAÍDAS (${exitCollectors.length}):`);
  exitCollectors.forEach(c => console.log(`  - ${c.name} (${c.ip})`));
  
  // Teste 2: Simular cadastro de visitante
  console.log('\n👤 TESTE DE CADASTRO DE VISITANTE:');
  console.log('=================================');
  
  const testVisitor = {
    nome: 'Maria Santos Silva',
    cpf: '98765432100',
    telefone: '(11) 98765-4321',
    email: 'maria.santos@email.com',
    documento: 'RG987654321'
  };
  
  console.log(`Visitante: ${testVisitor.nome}`);
  console.log(`CPF: ${testVisitor.cpf}`);
  console.log(`E-mail: ${testVisitor.email}`);
  
  const result = await service.createVisitorInAllDevices(testVisitor);
  
  // Analisar resultados
  console.log(`\n📊 RESULTADOS:`)
  console.log('=============');
  console.log(`Status geral: ${result.success ? '✅ SUCESSO' : '❌ FALHA'}`);
  console.log(`Coletores ativos: ${result.data.successCount}/${result.data.totalCollectors}`);
  
  console.log(`\n📋 DETALHES POR COLETOR:`);
  result.data.results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    const type = r.type === 'entrada' ? '🚪' : '🚶';
    console.log(`  ${status} ${type} ${r.collector} (${r.ip})`);
  });
  
  // Análise de entrada vs saída
  const entryResults = result.data.results.filter(r => r.type === 'entrada');
  const exitResults = result.data.results.filter(r => r.type === 'saida');
  
  const entrySuccess = entryResults.filter(r => r.success).length;
  const exitSuccess = exitResults.filter(r => r.success).length;
  
  console.log(`\n🎯 ANÁLISE DE ACESSO:`);
  console.log(`Entradas funcionando: ${entrySuccess}/${entryResults.length}`);
  console.log(`Saídas funcionando: ${exitSuccess}/${exitResults.length}`);
  
  // Conclusão
  console.log(`\n💡 CONCLUSÃO:`);
  console.log('=============');
  
  if (entrySuccess > 0 && exitSuccess > 0) {
    console.log('🎉 FLUXO COMPLETO FUNCIONANDO!');
    console.log('✅ Visitante pode ENTRAR e SAIR do condomínio');
    console.log('✅ Sistema pronto para uso na portaria');
  } else if (entrySuccess > 0) {
    console.log('⚠️ ENTRADA FUNCIONANDO, SAÍDA COM PROBLEMAS');
    console.log('✅ Visitante pode ENTRAR');
    console.log('❌ Verificar coletores de saída');
  } else if (exitSuccess > 0) {
    console.log('⚠️ SAÍDA FUNCIONANDO, ENTRADA COM PROBLEMAS');
    console.log('❌ Verificar coletores de entrada');
    console.log('✅ Saída está operacional');
  } else {
    console.log('❌ SISTEMA COM PROBLEMAS');
    console.log('❌ Verificar conectividade de rede');
    console.log('❌ Confirmar credenciais nos coletores');
  }
  
  console.log(`\n📝 PRÓXIMOS PASSOS:`);
  console.log('==================');
  console.log('1. 🏢 Ir à portaria e conectar na rede 192.168.1.x');
  console.log('2. 🔧 Acessar cada coletor e confirmar usuário/senha');
  console.log('3. ⚙️ Verificar se ISAPI está habilitado');
  console.log('4. 🧪 Testar com visitante real');
  console.log('5. 📱 Gerar link de convite e testar fluxo completo');
  
  return result;
}

// Executar teste
testVisitorFlow().catch(console.error); 
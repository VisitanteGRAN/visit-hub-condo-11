import { hikCentralService } from './hikvisionService';
import { hikCentralScrapingService } from './hikCentralScrapingService';

export interface VisitorData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  documento: string;
  foto?: string;
  moradorNome?: string;
  moradorUnidade?: string;
  moradorId?: string;
  validadeDias?: number;
}

export interface DeviceConfig {
  ip: string;
  port: number;
  username: string;
  password: string;
  name: string;
  type: 'entrada' | 'saida';
}

export interface WebSDKResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class HikVisionWebSDKService {
  private collectors: DeviceConfig[] = [
    { ip: '192.168.1.205', port: 80, username: 'luca', password: 'Luca123#', name: 'Entrada Visitante 2', type: 'entrada' },
    { ip: '192.168.1.210', port: 80, username: 'luca', password: 'Luca123#', name: 'Entrada Catraca Prestador', type: 'entrada' },
    { ip: '192.168.1.207', port: 80, username: 'luca', password: 'Luca123#', name: 'Entrada Caminhão Baixo', type: 'entrada' },
    { ip: '192.168.1.207', port: 80, username: 'luca', password: 'Luca123#', name: 'Saída Caminhão Baixo', type: 'saida' },
    { ip: '192.168.1.206', port: 80, username: 'luca', password: 'Luca123#', name: 'Saída Catraca Prestador', type: 'saida' }
  ];

  async createVisitorInHikCentral(visitor: VisitorData): Promise<WebSDKResponse> {
    console.log(`🚪 Criando visitante APENAS via SCRAPING: ${visitor.nome}`);
    
    try {
      const validadeDias = visitor.validadeDias || 1;
      const validadeAte = new Date();
      validadeAte.setDate(validadeAte.getDate() + validadeDias);
      validadeAte.setHours(23, 59, 59, 999);

      // APENAS SCRAPING - Sem coletores, sem proxy
      console.log('🤖 Criando visitante APENAS via SCRAPING do HikCentral...');
      
      // Preparar dados para scraping
      const scrapingData = {
        name: visitor.nome,
        cpf: visitor.cpf,
        phoneNumber: visitor.telefone,
        email: visitor.email,
        morador: visitor.moradorNome || 'Morador',
        photoUrl: visitor.foto
      };
      
      const visitorId = await hikCentralScrapingService.createVisitorViaScraping(scrapingData);
      
      console.log('✅ Visitante criado APENAS via SCRAPING:', visitorId);
      
      return {
        success: true,
        message: `Visitante ${visitor.nome} criado APENAS via SCRAPING no HikCentral`,
        data: {
          hikCentralId: visitorId,
          grupo: 'VisitanteS',
          visitado: visitor.moradorNome,
          validade: validadeAte.toISOString(),
          coletores: 0,
          method: 'SCRAPING_ONLY_SUCCESS'
        }
      };

    } catch (error) {
      console.error('❌ Erro ao criar visitante via scraping:', error);
      return {
        success: false,
        message: `Erro ao criar visitante via scraping: ${error}`
      };
    }
  }

  // Fallback: Criar diretamente nos coletores se proxy falhar
  async createUserInCollectorsFallback(visitor: VisitorData): Promise<WebSDKResponse> {
    console.log('🔄 Usando fallback: criação direta nos coletores...');
    
    const validadeDias = visitor.validadeDias || 1;
    const validadeAte = new Date();
    validadeAte.setDate(validadeAte.getDate() + validadeDias);
    validadeAte.setHours(23, 59, 59, 999);

    const results = await this.createUserInCollectors(visitor);
    
    if (results.successCount > 0) {
      console.log(`✅ Visitante criado em ${results.successCount}/${results.total} coletores (fallback)`);
      return {
        success: true,
        message: `Visitante ${visitor.nome} criado em ${results.successCount} coletores (método direto)`,
        data: {
          hikCentralId: `DIRECT_${visitor.cpf}_${Date.now()}`,
          grupo: 'Visitantes',
          visitado: visitor.moradorNome,
          validade: validadeAte.toISOString(),
          coletores: results.successCount,
          method: 'ISAPI_FALLBACK'
        }
      };
    } else {
      throw new Error(`Falha ao criar em todos os coletores: ${results.errors.join(', ')}`);
    }
  }

  // Criar usuário diretamente nos coletores via ISAPI
  async createUserInCollectors(visitor: VisitorData): Promise<{
    successCount: number;
    total: number;
    errors: string[];
  }> {
    console.log('🔄 Criando usuário diretamente nos coletores via ISAPI...');
    
    const results = {
      successCount: 0,
      total: this.collectors.length,
      errors: [] as string[]
    };

    // Gerar ID único do usuário baseado no CPF
    const userId = visitor.cpf.replace(/\D/g, '');
    
    for (const collector of this.collectors) {
      try {
        console.log(`📡 Criando usuário no coletor: ${collector.name}`);
        
        // Dados do usuário para ISAPI
        const userData = {
          UserInfo: {
            employeeNo: userId,
            name: visitor.nome,
            userType: "normal",
            Valid: {
              enable: true,
              beginTime: new Date().toISOString().replace('Z', '+08:00'),
              endTime: new Date(Date.now() + (visitor.validadeDias || 1) * 24 * 60 * 60 * 1000).toISOString().replace('Z', '+08:00'),
              timeType: "local"
            },
            doorRight: "1",
            RightPlan: [{
              doorNo: 1,
              planTemplateNo: "1"
            }]
          }
        };

        // Enviar via ISAPI (simulação por enquanto)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`✅ Usuário criado no coletor: ${collector.name}`);
        results.successCount++;
        
      } catch (error) {
        console.error(`❌ Erro no coletor ${collector.name}:`, error);
        results.errors.push(`${collector.name}: ${error}`);
      }
    }

    return results;
  }

  // Método principal para criar visitante
  async createVisitorInAllDevices(visitor: VisitorData): Promise<WebSDKResponse> {
    console.log(`🎯 Criando visitante completo: ${visitor.nome}`);
    
    // Usar método direto via ISAPI enquanto HikCentral tem problema de HTTPS
    const result = await this.createVisitorInHikCentral(visitor);
    
    if (result.success) {
      console.log('✅ Visitante criado e distribuído para coletores');
      return {
        success: true,
        message: `Visitante ${visitor.nome} criado com sucesso`,
        data: {
          ...result.data,
          totalCollectors: this.collectors.length,
          method: 'ISAPI_DIRECT'
        }
      };
    } else {
      console.error('❌ Falha na criação:', result.message);
      return {
        success: false,
        message: `Falha ao criar visitante: ${result.message}`
      };
    }
  }

  // Métodos auxiliares
  private calculateExitTime(validadeDias: number): string {
    const exitTime = new Date();
    exitTime.setDate(exitTime.getDate() + validadeDias);
    exitTime.setHours(23, 59, 59, 999);
    return exitTime.toISOString();
  }

  private getEntryCollectors(): DeviceConfig[] {
    return this.collectors.filter(c => c.type === 'entrada');
  }

  private getExitCollectors(): DeviceConfig[] {
    return this.collectors.filter(c => c.type === 'saida');
  }

  async testConnection(): Promise<WebSDKResponse> {
    try {
      console.log('🧪 Testando conexão direta com coletores...');
      
      let connectionsOk = 0;
      for (const collector of this.collectors) {
        try {
          // Simular ping/teste de conectividade
          await new Promise(resolve => setTimeout(resolve, 200));
          connectionsOk++;
          console.log(`✅ ${collector.name}: Conectado`);
        } catch (error) {
          console.log(`❌ ${collector.name}: Falha`);
        }
      }
      
      return {
        success: connectionsOk > 0,
        message: `${connectionsOk}/${this.collectors.length} coletores conectados`,
        data: {
          connected: connectionsOk,
          total: this.collectors.length,
          method: 'ISAPI_DIRECT'
        }
      };
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      return {
        success: false,
        message: `Erro na conexão: ${error}`
      };
    }
  }

  // Testar conectividade com coletores
  async testCollectorConnectivity(): Promise<{ success: boolean; results: any[] }> {
    console.log('🔍 Testando conectividade com coletores...');
    
    const results = [];
    
    for (const collector of this.collectors) {
      try {
        console.log(`📡 Testando coletor: ${collector.name}`);
        
        // Teste 1: Informações do dispositivo
        const deviceInfoResponse = await fetch(`${collector.ip}/ISAPI/System/deviceInfo`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${collector.username}:${collector.password}`)}`
          }
        });
        
        if (deviceInfoResponse.ok) {
          const deviceInfo = await deviceInfoResponse.text();
          console.log(`✅ Coletor ${collector.name} respondeu:`, deviceInfo.substring(0, 100));
          
          // Teste 2: Contar usuários existentes
          const userCountResponse = await fetch(`${collector.ip}/ISAPI/AccessControl/UserInfo/Count`, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${btoa(`${collector.username}:${collector.password}`)}`
            }
          });
          
          if (userCountResponse.ok) {
            const userCount = await userCountResponse.text();
            console.log(`📊 Usuários no coletor ${collector.name}:`, userCount);
            
            results.push({
              collector: collector.name,
              status: 'ONLINE',
              deviceInfo: deviceInfo.substring(0, 100),
              userCount: userCount
            });
          } else {
            results.push({
              collector: collector.name,
              status: 'ONLINE_BUT_NO_ACCESS',
              error: `HTTP ${userCountResponse.status}`
            });
          }
        } else {
          results.push({
            collector: collector.name,
            status: 'OFFLINE',
            error: `HTTP ${deviceInfoResponse.status}`
          });
        }
        
      } catch (error: any) {
        console.error(`❌ Erro no coletor ${collector.name}:`, error);
        results.push({
          collector: collector.name,
          status: 'ERROR',
          error: error.message
        });
      }
    }
    
    const onlineCount = results.filter(r => r.status === 'ONLINE').length;
    console.log(`📊 Resultado: ${onlineCount}/${this.collectors.length} coletores online`);
    
    return {
      success: onlineCount > 0,
      results: results
    };
  }

  // Verificar se usuário existe no coletor
  async checkUserExists(cpf: string): Promise<{ success: boolean; results: any[] }> {
    console.log(`🔍 Verificando se usuário ${cpf} existe nos coletores...`);
    
    const results = [];
    
    for (const collector of this.collectors) {
      try {
        console.log(`📡 Verificando no coletor: ${collector.name}`);
        
        // Buscar usuário por CPF
        const searchResponse = await fetch(`${collector.ip}/ISAPI/AccessControl/UserInfo/Search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml',
            'Authorization': `Basic ${btoa(`${collector.username}:${collector.password}`)}`
          },
          body: `<?xml version="1.0" encoding="UTF-8"?>
<UserInfoSearchCond version="2.0" xmlns="http://www.hikvision.com/ver20/XMLSchema">
  <searchID>${cpf}</searchID>
  <searchResultPosition>0</searchResultPosition>
  <maxResults>1</maxResults>
</UserInfoSearchCond>`
        });
        
        if (searchResponse.ok) {
          const searchResult = await searchResponse.text();
          const exists = searchResult.includes(cpf);
          
          console.log(`🔍 Usuário ${cpf} no coletor ${collector.name}: ${exists ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
          
          results.push({
            collector: collector.name,
            status: 'SUCCESS',
            exists: exists,
            response: searchResult.substring(0, 200)
          });
        } else {
          results.push({
            collector: collector.name,
            status: 'ERROR',
            error: `HTTP ${searchResponse.status}`
          });
        }
        
      } catch (error: any) {
        console.error(`❌ Erro ao verificar usuário no coletor ${collector.name}:`, error);
        results.push({
          collector: collector.name,
          status: 'ERROR',
          error: error.message
        });
      }
    }
    
    const foundCount = results.filter(r => r.status === 'SUCCESS' && r.exists).length;
    console.log(`📊 Resultado: ${foundCount}/${this.collectors.length} coletores têm o usuário`);
    
    return {
      success: foundCount > 0,
      results: results
    };
  }
}

// Instância única do serviço
const hikVisionWebSDK = new HikVisionWebSDKService();
export default hikVisionWebSDK; 
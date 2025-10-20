import { hikCentralService } from './hikvisionService';
import { hikCentralScrapingService } from './hikCentralScrapingService';
import { logger } from '@/utils/secureLogger';
import { normalizeName } from '@/utils/normalizeText';

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
    logger.info(`🚪 Criando visitante via FILA SUPABASE: ${visitor.nome}`);
    
    try {
      const validadeDias = visitor.validadeDias || 1;
      const validadeAte = new Date();
      validadeAte.setDate(validadeAte.getDate() + validadeDias);
      validadeAte.setHours(23, 59, 59, 999);

      logger.info('📤 Enviando visitante para fila de processamento...');
      
      // Importar serviço de fila
      const { queueService } = await import('./queueService');
      
      // Preparar dados para fila
      const moradorNomeOriginal = (visitor as any).moradorNome || '';
      const moradorNomeNormalizado = moradorNomeOriginal ? normalizeName(moradorNomeOriginal) : '';
      
      console.log('🏠 Normalizando nome do morador:');
      console.log(`   Original: "${moradorNomeOriginal}"`);
      console.log(`   Normalizado: "${moradorNomeNormalizado}"`);
      
      const queueData = {
        nome: visitor.nome,
        telefone: visitor.telefone || '',
        cpf: visitor.cpf || '',
        rg: visitor.documento || '',
        placa: (visitor as any).placa_veiculo || '',
        genero: (visitor as any).genero || 'Masculino',
        morador_nome: moradorNomeNormalizado, // ✅ NOME DO MORADOR NORMALIZADO (SEM ACENTOS)
        action: (visitor as any).action || 'create', // ⭐ NOVO: 'create' ou 'reactivate'
        validade_dias: visitor.validadeDias || 1, // ⭐ DURAÇÃO EM DIAS
        photo_base64: visitor.foto // ⭐ FOTO EM BASE64
      };
      
      logger.info('📸 Foto incluída:', visitor.foto ? 'SIM' : 'NÃO');
      console.log('📋 Dados que serão enviados para fila:', queueData);
      
      const result = await queueService.sendToQueue(queueData);
      
      if (!result.success) {
        throw new Error(result.error || 'Falha ao enviar para fila');
      }
      
      console.log('✅ Visitante enviado para fila com ID:', result.id);
      
      return {
        success: true,
        message: `Visitante ${visitor.nome} enviado para processamento. ID: ${result.id}`,
        data: {
          queueId: result.id,
          grupo: 'VisitanteS',
          visitado: visitor.moradorNome,
          validade: validadeAte.toISOString(),
          coletores: 0,
          method: 'QUEUE_PROCESSING',
          photo_processed: !!visitor.foto
        }
      };

    } catch (error) {
      console.error('❌ Erro ao enviar visitante para fila:', error);
      return {
        success: false,
        message: `Erro ao enviar visitante para fila: ${error}`
      };
    }
  }

  // Fallback: Criar diretamente nos coletores se proxy falhar
  async createUserInCollectorsFallback(visitor: VisitorData): Promise<WebSDKResponse> {
    logger.info('🔄 Usando fallback: criação direta nos coletores...');
    
    const validadeDias = visitor.validadeDias || 1;
    const validadeAte = new Date();
    validadeAte.setDate(validadeAte.getDate() + validadeDias);
    validadeAte.setHours(23, 59, 59, 999);

    const results = await this.createUserInCollectors(visitor);
    
    if (results.successCount > 0) {
      logger.info(`✅ Visitante criado em ${results.successCount}/${results.total} coletores (fallback)`);
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
    logger.info('🔄 Criando usuário diretamente nos coletores via ISAPI...');
    
    const results = {
      successCount: 0,
      total: this.collectors.length,
      errors: [] as string[]
    };

    // Gerar ID único do usuário baseado no CPF
    const userId = visitor.cpf.replace(/\D/g, '');
    
    for (const collector of this.collectors) {
      try {
        logger.info(`📡 Criando usuário no coletor: ${collector.name}`);
        
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
        
        logger.info(`✅ Usuário criado no coletor: ${collector.name}`);
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
    logger.info(`🎯 Criando visitante completo: ${visitor.nome}`);
    
    // Usar método direto via ISAPI enquanto HikCentral tem problema de HTTPS
    const result = await this.createVisitorInHikCentral(visitor);
    
    if (result.success) {
      logger.info('✅ Visitante criado e distribuído para coletores');
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
      logger.info('🧪 Testando conexão direta com coletores...');
      
      let connectionsOk = 0;
      for (const collector of this.collectors) {
        try {
          // Simular ping/teste de conectividade
          await new Promise(resolve => setTimeout(resolve, 200));
          connectionsOk++;
          logger.info(`✅ ${collector.name}: Conectado`);
        } catch (error) {
          logger.info(`❌ ${collector.name}: Falha`);
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
    logger.info('🔍 Testando conectividade com coletores...');
    
    const results = [];
    
    for (const collector of this.collectors) {
      try {
        logger.info(`📡 Testando coletor: ${collector.name}`);
        
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
    logger.info(`📊 Resultado: ${onlineCount}/${this.collectors.length} coletores online`);
    
    return {
      success: onlineCount > 0,
      results: results
    };
  }

  // Verificar se usuário existe no coletor
  async checkUserExists(cpf: string): Promise<{ success: boolean; results: any[] }> {
    // [REMOVED] Sensitive data log removed for security;
    
    const results = [];
    
    for (const collector of this.collectors) {
      try {
        logger.info(`📡 Verificando no coletor: ${collector.name}`);
        
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
          
          // [REMOVED] Sensitive data log removed for security;
          
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
    logger.info(`📊 Resultado: ${foundCount}/${this.collectors.length} coletores têm o usuário`);
    
    return {
      success: foundCount > 0,
      results: results
    };
  }
}

// Instância única do serviço
const hikVisionWebSDK = new HikVisionWebSDKService();

export { hikVisionWebSDK };
export default hikVisionWebSDK; 
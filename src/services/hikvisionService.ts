import axios from 'axios';
import { logger } from '@/utils/secureLogger';

export interface HikCentralConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout: number;
}

export interface HikCentralDevice {
  id: string;
  name: string;
  type: string;
  status: string;
  ipAddress?: string;
  port?: number;
}

export interface HikCentralUser {
  id: string;
  name: string;
  cardNo?: string;
  userType: string;
  faceData?: string;
  phoneNumber?: string;
  email?: string;
  validPeriod?: {
    startTime: string;
    endTime: string;
  };
}

export class HikCentralService {
  private config: HikCentralConfig;
  private authToken: string | null = null;
  private sessionId: string | null = null;

  constructor(config: HikCentralConfig) {
    this.config = config;
  }

  // Autenticação com HikCentral usando a API correta
  async authenticate(): Promise<boolean> {
    try {
      logger.info('🔐 Autenticando com HikCentral...');
      
      // HikCentral usa autenticação via POST /api/system/v2/login
      const response = await axios.post(`${this.config.baseUrl}/api/system/v2/login`, {
        userName: this.config.username,
        password: this.config.password
      }, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data.code === 0) {
        this.sessionId = response.data.data.sessionId;
        console.log('✅ Autenticado com HikCentral:', response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro na autenticação HikCentral:', error);
      return false;
    }
  }

  // Obter informações do sistema HikCentral
  async getSystemInfo(): Promise<any> {
    try {
      if (!this.sessionId) {
        await this.authenticate();
      }

      const response = await axios.get(`${this.config.baseUrl}/api/system/v2/deviceInfo`, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações do sistema:', error);
      throw error;
    }
  }

  // Listar dispositivos (câmeras, controladores de acesso)
  async getDevices(): Promise<HikCentralDevice[]> {
    try {
      if (!this.sessionId) {
        await this.authenticate();
      }

      const response = await axios.get(`${this.config.baseUrl}/api/device/v2/list`, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId
        }
      });

      if (response.data.code === 0) {
        return response.data.data.devices || [];
      }
      return [];
    } catch (error) {
      console.error('Erro ao listar dispositivos:', error);
      throw error;
    }
  }

  // Criar usuário no HikCentral
  async createUser(userData: {
    name: string;
    cardNo?: string;
    userType?: string;
    phoneNumber?: string;
    email?: string;
    validPeriod?: {
      startTime: string;
      endTime: string;
    };
  }): Promise<{ success: boolean; userId?: string; message: string }> {
    try {
      logger.info(console.log('👤 Criando usuário no HikCentral:', { userData: '[SANITIZED]' });
      
      if (!this.sessionId) {
        await this.authenticate();
      }

      const userConfig = {
        userName: userData.name,
        cardNo: userData.cardNo || '',
        userType: userData.userType || 'normal',
        phoneNumber: userData.phoneNumber || '',
        email: userData.email || '',
        validPeriod: userData.validPeriod || {
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
        }
      };

      const response = await axios.post(
        `${this.config.baseUrl}/api/user/v2/create`,
        userConfig,
        {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': this.sessionId
          }
        }
      );

      if (response.data.code === 0) {
        console.log('✅ Usuário criado no HikCentral:', response.data);
        return {
          success: true,
          userId: response.data.data.userId,
          message: 'Usuário criado com sucesso'
        };
      }
      return {
        success: false,
        message: response.data.msg || 'Erro ao criar usuário'
      };
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return {
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`
      };
    }
  }

  // Upload de foto para reconhecimento facial
  async uploadFacePhoto(userId: string, photoBase64: string): Promise<boolean> {
    try {
      logger.info('📸 Enviando foto para reconhecimento facial...');
      
      if (!this.sessionId) {
        await this.authenticate();
      }

      const response = await axios.post(
        `${this.config.baseUrl}/api/user/v2/${userId}/face`,
        {
          faceData: photoBase64,
          faceType: 'photo'
        },
        {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': this.sessionId
          }
        }
      );

      if (response.data.code === 0) {
        logger.info('✅ Foto enviada com sucesso para reconhecimento facial');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao enviar foto:', error);
      return false;
    }
  }

  // Criar visitante no HikCentral (método específico para visitantes)
  async createVisitor(visitorData: {
    name: string;
    certificateNo: string;
    phoneNumber: string;
    email: string;
    groupId?: number;
    beginTime: string;
    endTime: string;
    visitedPerson: string;
    visitAddress: string;
    visitPurpose: string;
    status: number;
    faceData?: string;
  }): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      console.log('👥 Criando visitante no HikCentral:', visitorData.name);
      
      if (!this.sessionId) {
        await this.authenticate();
      }

      const visitorConfig = {
        name: visitorData.name,
        certificateNo: visitorData.certificateNo,
        phoneNumber: visitorData.phoneNumber,
        email: visitorData.email,
        groupId: visitorData.groupId || 1, // Grupo padrão de visitantes
        beginTime: visitorData.beginTime,
        endTime: visitorData.endTime,
        visitedPerson: visitorData.visitedPerson,
        visitAddress: visitorData.visitAddress,
        visitPurpose: visitorData.visitPurpose,
        status: visitorData.status,
        ...(visitorData.faceData && { faceData: visitorData.faceData })
      };

      const response = await axios.post(
        `${this.config.baseUrl}/api/visitor/v2/create`,
        visitorConfig,
        {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': this.sessionId
          }
        }
      );

      if (response.data.code === 0) {
        console.log('✅ Visitante criado no HikCentral:', response.data);
        return {
          success: true,
          data: response.data.data,
          message: 'Visitante criado com sucesso'
        };
      }
      return {
        success: false,
        message: response.data.msg || 'Erro ao criar visitante'
      };
    } catch (error) {
      console.error('❌ Erro ao criar visitante:', error);
      return {
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`
      };
    }
  }

  // Controlar acesso (abrir/fechar portão)
  async controlAccess(deviceId: string, action: 'open' | 'close'): Promise<boolean> {
    try {
      logger.info(`🚪 ${action === 'open' ? 'Abrindo' : 'Fechando'} portão...`);
      
      if (!this.sessionId) {
        await this.authenticate();
      }

      const response = await axios.post(
        `${this.config.baseUrl}/api/device/v2/${deviceId}/control`,
        {
          action: action,
          timestamp: new Date().toISOString()
        },
        {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': this.sessionId
          }
        }
      );

      if (response.data.code === 0) {
        logger.info(`✅ Portão ${action === 'open' ? 'aberto' : 'fechado'} com sucesso`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Erro ao ${action === 'open' ? 'abrir' : 'fechar'} portão:`, error);
      return false;
    }
  }

  // Testar conexão completa
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      logger.info('🔍 Testando conexão com HikCentral...');
      
      const isAuthenticated = await this.authenticate();
      if (!isAuthenticated) {
        return {
          success: false,
          message: 'Falha na autenticação. Verifique usuário e senha.'
        };
      }

      const systemInfo = await this.getSystemInfo();
      const devices = await this.getDevices();

      return {
        success: true,
        message: `Conectado com sucesso ao HikCentral!`,
        details: {
          systemInfo,
          devicesCount: devices.length,
          devices: devices.slice(0, 3) // Primeiros 3 dispositivos
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`
      };
    }
  }

  // Obter informações de rede
  async getNetworkInfo(): Promise<any> {
    try {
      if (!this.sessionId) {
        await this.authenticate();
      }

      const response = await axios.get(`${this.config.baseUrl}/api/system/v2/network`, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações de rede:', error);
      throw error;
    }
  }

  // Logout da sessão
  async logout(): Promise<void> {
    try {
      if (this.sessionId) {
        await axios.post(`${this.config.baseUrl}/api/system/v2/logout`, {}, {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': this.sessionId
          }
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      this.sessionId = null;
      this.authToken = null;
    }
  }
}

// Instância configurada com as credenciais reais do HikCentral
// Tentar múltiplas configurações HTTPS
const hikCentralConfigs = [
  { baseUrl: 'https://45.4.132.189:8443', port: '8443' }, // HTTPS padrão HikCentral
  { baseUrl: 'https://45.4.132.189:443', port: '443' },   // HTTPS padrão web
  { baseUrl: 'https://45.4.132.189:8208', port: '8208' }, // Mesma porta com HTTPS
];

export const hikCentralService = new HikCentralService({
  baseUrl: 'https://45.4.132.189:8443', // Tentar HTTPS primeiro
  username: 'luca', // Usuário parceiro selecionado
  password: 'Luca123#',
  timeout: 30000
}); 
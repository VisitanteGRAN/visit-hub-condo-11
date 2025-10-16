import axios from 'axios';
import { logger } from '@/utils/secureLogger';

export interface ISAPIConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout: number;
}

export interface ISAPIUser {
  id: string;
  name: string;
  cardNo?: string;
  userType: string;
  phoneNumber?: string;
  email?: string;
  validPeriod?: {
    startTime: string;
    endTime: string;
  };
}

export interface ISAPIDevice {
  id: string;
  name: string;
  type: string;
  status: string;
  ipAddress?: string;
  port?: number;
}

export class HikCentralISAPIService {
  private config: ISAPIConfig;
  private authToken: string | null = null;

  constructor(config: ISAPIConfig) {
    this.config = config;
  }

  // Autenticação ISAPI
  async authenticate(): Promise<boolean> {
    try {
      logger.info('🔐 Autenticando com HikCentral ISAPI...');
      
      // ISAPI usa autenticação básica HTTP
      const response = await axios.get(`${this.config.baseUrl}/ISAPI/System/deviceInfo`, {
        auth: {
          username: this.config.username,
          password: this.config.password
        },
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        console.log('✅ Autenticado com HikCentral ISAPI:', response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro na autenticação ISAPI:', error);
      return false;
    }
  }

  // Obter informações do sistema
  async getSystemInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/ISAPI/System/deviceInfo`, {
        auth: {
          username: this.config.username,
          password: this.config.password
        },
        timeout: this.config.timeout
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações do sistema:', error);
      throw error;
    }
  }

  // Listar dispositivos
  async getDevices(): Promise<ISAPIDevice[]> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/ISAPI/Device/list`, {
        auth: {
          username: this.config.username,
          password: this.config.password
        },
        timeout: this.config.timeout
      });

      if (response.data && response.data.devices) {
        return response.data.devices;
      }
      return [];
    } catch (error) {
      console.error('Erro ao listar dispositivos:', error);
      throw error;
    }
  }

  // Criar usuário via ISAPI
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
      logger.info('👤 Criando usuário via ISAPI:', { userData: '[SANITIZED]' });
      
      const userConfig = {
        userName: userData.name,
        cardNo: userData.cardNo || '',
        userType: userData.userType || 'normal',
        phoneNumber: userData.phoneNumber || '',
        email: userData.email || '',
        validPeriod: userData.validPeriod || {
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      const response = await axios.post(
        `${this.config.baseUrl}/ISAPI/User/create`,
        userConfig,
        {
          auth: {
            username: this.config.username,
            password: this.config.password
          },
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Usuário criado via ISAPI:', response.data);
        return {
          success: true,
          userId: response.data.userId || response.data.id,
          message: 'Usuário criado com sucesso'
        };
      }
      return {
        success: false,
        message: 'Erro ao criar usuário'
      };
    } catch (error) {
      console.error('❌ Erro ao criar usuário via ISAPI:', error);
      return {
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`
      };
    }
  }

  // Upload de foto para reconhecimento facial
  async uploadFacePhoto(userId: string, photoBase64: string): Promise<boolean> {
    try {
      logger.info('📸 Enviando foto via ISAPI...');
      
      const response = await axios.post(
        `${this.config.baseUrl}/ISAPI/User/${userId}/face`,
        {
          faceData: photoBase64,
          faceType: 'photo'
        },
        {
          auth: {
            username: this.config.username,
            password: this.config.password
          },
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        logger.info('✅ Foto enviada via ISAPI');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao enviar foto via ISAPI:', error);
      return false;
    }
  }

  // Controlar acesso (abrir/fechar portão)
  async controlAccess(deviceId: string, action: 'open' | 'close'): Promise<boolean> {
    try {
      logger.info(`🚪 ${action === 'open' ? 'Abrindo' : 'Fechando'} portão via ISAPI...`);
      
      const response = await axios.post(
        `${this.config.baseUrl}/ISAPI/Device/${deviceId}/control`,
        {
          action: action,
          timestamp: new Date().toISOString()
        },
        {
          auth: {
            username: this.config.username,
            password: this.config.password
          },
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        logger.info(`✅ Portão ${action === 'open' ? 'aberto' : 'fechado'} via ISAPI`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Erro ao ${action === 'open' ? 'abrir' : 'fechar'} portão via ISAPI:`, error);
      return false;
    }
  }

  // Testar conexão completa
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      logger.info('🔍 Testando conexão com HikCentral ISAPI...');
      
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
        message: `Conectado com sucesso ao HikCentral ISAPI!`,
        details: {
          systemInfo,
          devicesCount: devices.length,
          devices: devices.slice(0, 3)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`
      };
    }
  }
}

// Instância configurada com ISAPI
export const hikCentralISAPIService = new HikCentralISAPIService({
  baseUrl: 'http://45.4.132.189', // Porta padrão HTTP (80)
  username: 'luca',
  password: 'Luca123#',
  timeout: 30000
}); 
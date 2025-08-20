import axios from 'axios';
import { logger } from '../utils/logger';

export interface HikCentralAutomationRequest {
  visitor_id: string;
  visitor_data: {
    name: string;
    cpf: string;
    phone: string;
    email?: string;
    photo_url?: string;
  };
}

export interface HikCentralAutomationResponse {
  success: boolean;
  message: string;
  hikcentral_id?: string;
  error?: string;
  step?: string;
  timestamp: string;
}

export class HikvisionAutomationService {
  private automationApiUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 5000; // 5 segundos

  constructor() {
    // URL da API local da máquina da portaria
    this.automationApiUrl = process.env.HIKCENTRAL_AUTOMATION_API_URL || 'http://localhost:5000';
  }

  /**
   * Executa a automação do HikCentral para um visitante
   */
  async executeAutomation(request: HikCentralAutomationRequest): Promise<HikCentralAutomationResponse> {
    try {
      logger.info(`🚀 Iniciando automação HikCentral para visitante ${request.visitor_id}`);

      // Tentar executar a automação com retry
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await this.callAutomationAPI(request);
          
          if (response.success) {
            logger.info(`✅ Automação HikCentral concluída com sucesso para visitante ${request.visitor_id}`);
            return response;
          } else {
            logger.warn(`⚠️ Tentativa ${attempt} falhou: ${response.error}`);
            
            if (attempt === this.maxRetries) {
              return response;
            }
            
            // Aguardar antes da próxima tentativa
            await this.delay(this.retryDelay * attempt);
          }
        } catch (error) {
          logger.error(`❌ Erro na tentativa ${attempt}: ${error}`);
          
          if (attempt === this.maxRetries) {
            throw error;
          }
          
          // Aguardar antes da próxima tentativa
          await this.delay(this.retryDelay * attempt);
        }
      }

      throw new Error('Todas as tentativas de automação falharam');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(`❌ Falha na automação HikCentral: ${errorMessage}`);
      
      return {
        success: false,
        message: 'Falha na automação do HikCentral',
        error: errorMessage,
        step: 'automation_execution',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Chama a API local de automação
   */
  private async callAutomationAPI(request: HikCentralAutomationRequest): Promise<HikCentralAutomationResponse> {
    try {
      const response = await axios.post(
        `${this.automationApiUrl}/api/hikcentral/automation`,
        request,
        {
          timeout: 300000, // 5 minutos de timeout
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.HIKCENTRAL_AUTOMATION_API_KEY || 'default-key'}`
          }
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('API de automação não está disponível. Verifique se o serviço está rodando na máquina da portaria.');
        }
        if (error.response) {
          throw new Error(`Erro da API de automação: ${error.response.status} - ${error.response.data?.message || 'Erro desconhecido'}`);
        }
        if (error.code === 'ETIMEDOUT') {
          throw new Error('Timeout na comunicação com a API de automação');
        }
      }
      throw error;
    }
  }

  /**
   * Verifica o status da automação
   */
  async checkAutomationStatus(visitorId: string): Promise<HikCentralAutomationResponse> {
    try {
      const response = await axios.get(
        `${this.automationApiUrl}/api/hikcentral/status/${visitorId}`,
        {
          timeout: 30000,
          headers: {
            'Authorization': `Bearer ${process.env.HIKCENTRAL_AUTOMATION_API_KEY || 'default-key'}`
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`❌ Erro ao verificar status da automação: ${error}`);
      throw error;
    }
  }

  /**
   * Cancela uma automação em andamento
   */
  async cancelAutomation(visitorId: string): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.automationApiUrl}/api/hikcentral/automation/${visitorId}`,
        {
          timeout: 30000,
          headers: {
            'Authorization': `Bearer ${process.env.HIKCENTRAL_AUTOMATION_API_KEY || 'default-key'}`
          }
        }
      );

      return response.status === 200;
    } catch (error) {
      logger.error(`❌ Erro ao cancelar automação: ${error}`);
      return false;
    }
  }

  /**
   * Verifica se a API de automação está disponível
   */
  async checkAutomationAPIHealth(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.automationApiUrl}/api/health`,
        { timeout: 10000 }
      );
      return response.status === 200;
    } catch (error) {
      logger.warn(`⚠️ API de automação não está disponível: ${error}`);
      return false;
    }
  }

  /**
   * Delay para retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const hikvisionAutomationService = new HikvisionAutomationService(); 
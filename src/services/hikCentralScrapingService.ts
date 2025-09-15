/**
 * 🤖 HIK CENTRAL SCRAPING SERVICE - NOVA VERSÃO
 * =============================================
 * Integração com o novo sistema de automação
 */

import automationService, { VisitorAutomationData } from './automationService';
import { logger } from '@/utils/secureLogger';

export class HikCentralScrapingService {
  private logs: string[] = [];

  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    this.logs.push(logMessage);
    console.log(logMessage);
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  async testConnection(): Promise<boolean> {
    this.log('🔗 Testando conexão com servidor de automação...');
    
    try {
      const isHealthy = await automationService.checkHealth();
      
      if (isHealthy) {
        this.log('✅ Servidor de automação está funcionando!');
        return true;
      } else {
        this.log('❌ Servidor de automação não está respondendo');
        return false;
      }
    } catch (error) {
      this.log(`❌ Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return false;
    }
  }

  async createVisitorViaScraping(visitorData: {
    name: string;
    cpf: string;
    phoneNumber: string;
    email: string;
    morador: string;
    photoUrl?: string;
    photo_base64?: string; // Nova propriedade para foto em base64
  }): Promise<string> {
    this.log('🤖 Iniciando criação de visitante via Nova Automação...');
    this.log(`👤 Visitante: ${visitorData.name}`);

    try {
      // Verificar se servidor está funcionando
      const isHealthy = await automationService.checkHealth();
      if (!isHealthy) {
        throw new Error('Servidor de automação não está disponível');
      }

      // Gerar ID único para o visitante
      const visitorId = automationService.generateVisitorId(
        visitorData.name,
        visitorData.cpf
      );

      this.log(`🆔 ID gerado: ${visitorId}`);

      // Preparar dados para nova automação
      const automationData: VisitorAutomationData = {
        name: visitorData.name,
        cpf: visitorData.cpf,
        phone: visitorData.phoneNumber,
        email: visitorData.email,
        rg: visitorData.cpf?.substring(0, 8) || '', // Usar CPF como RG se não fornecido
        placa: '', // Pode ser preenchido posteriormente
        photo_base64: visitorData.photo_base64 // Foto em base64
      };

      this.log('🚀 Iniciando automação no servidor...');

      // Iniciar automação
      const automationResult = await automationService.startAutomation(
        visitorId,
        automationData
      );

      if (!automationResult.success) {
        throw new Error(automationResult.error || 'Falha na automação');
      }

      this.log('✅ Automação iniciada com sucesso!');
      
      if (automationResult.photo_received) {
        this.log('📸 Foto recebida e processada pelo servidor');
      }

      this.log('⏳ Monitorando progresso da automação...');

      // Monitorar progresso da automação
      const finalStatus = await automationService.monitorAutomation(
        visitorId,
        (status) => {
          const currentStatus = status.status.status;
          
          switch (currentStatus) {
            case 'pending':
              this.log('⏳ Aguardando na fila de processamento...');
              break;
            case 'processing':
              this.log('🤖 Executando automação no HikCentral...');
              break;
            case 'completed':
              this.log('✅ Automação concluída com sucesso!');
              break;
            case 'failed':
              this.log('❌ Falha na automação');
              break;
          }
        },
        180000 // 3 minutos timeout
      );

      // Verificar resultado final
      if (finalStatus?.status.status === 'completed') {
        this.log('🎉 Visitante cadastrado com sucesso no HikCentral!');
        this.log(`🆔 ID final: ${visitorId}`);
        
        if (automationData.photo_base64) {
          this.log('📸 Foto do rosto registrada para reconhecimento facial!');
        }
        
        return visitorId;
        
      } else if (finalStatus?.status.status === 'failed') {
        const errorMsg = finalStatus.status.error_message || 'Erro desconhecido na automação';
        this.log(`❌ Automação falhou: ${errorMsg}`);
        throw new Error(`Falha na automação: ${errorMsg}`);
        
      } else {
        this.log('⏰ Timeout na automação - processo pode estar em andamento');
        // Retornar ID mesmo com timeout, pois pode completar depois
        return visitorId;
      }

    } catch (error) {
      this.log(`❌ Erro ao criar visitante: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    }
  }

  async discoverPageStructure(): Promise<any> {
    this.log('🔍 Obtendo estatísticas do servidor de automação...');
    
    try {
      const stats = await automationService.getStats();
      
      if (stats) {
        this.log('📊 Estatísticas obtidas com sucesso');
        return {
          success: true,
          server_stats: stats,
          message: 'Servidor de automação funcionando'
        };
      } else {
        this.log('⚠️ Não foi possível obter estatísticas');
        return {
          success: false,
          message: 'Servidor não está respondendo às estatísticas'
        };
      }
      
    } catch (error) {
      this.log(`❌ Erro ao obter estrutura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Método para listar automações em andamento
   */
  async getActiveAutomations(): Promise<any> {
    this.log('📋 Obtendo automações ativas...');
    
    try {
      const stats = await automationService.getStats();
      
      if (stats && stats.stats) {
        const activeInfo = {
          queue_size: stats.stats.queue_size || 0,
          active_automations: stats.stats.active_automations || 0,
          active_list: stats.stats.active_list || [],
          max_workers: stats.stats.max_workers || 3
        };
        
        this.log(`📊 Automações ativas: ${activeInfo.active_automations}/${activeInfo.max_workers} workers`);
        this.log(`📋 Na fila: ${activeInfo.queue_size}`);
        
        return activeInfo;
      }
      
      return { active_automations: 0, queue_size: 0 };
      
    } catch (error) {
      this.log(`❌ Erro ao obter automações ativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return { active_automations: 0, queue_size: 0 };
    }
  }

  /**
   * Método para verificar status de uma automação específica
   */
  async checkAutomationStatus(visitorId: string): Promise<any> {
    this.log(`🔍 Verificando status da automação: ${visitorId}`);
    
    try {
      const status = await automationService.getAutomationStatus(visitorId);
      
      if (status) {
        this.log(`📊 Status: ${status.status.status}`);
        return status;
      } else {
        this.log('❓ Automação não encontrada');
        return null;
      }
      
    } catch (error) {
      this.log(`❌ Erro ao verificar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    }
  }
}

// Exportar instância singleton
export const hikCentralScrapingService = new HikCentralScrapingService();

export default hikCentralScrapingService; 
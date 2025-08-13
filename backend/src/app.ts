import Server from './server';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import cron from 'node-cron';
import { VisitanteService } from '@/services/visitanteService';
import { StorageService } from '@/services/storageService';
import { NotificationService } from '@/services/notificationService';

class Application {
  private server: Server;
  private visitanteService: VisitanteService;
  private storageService: StorageService;
  private notificationService: NotificationService;

  constructor() {
    this.server = new Server();
    this.visitanteService = new VisitanteService();
    this.storageService = new StorageService();
    this.notificationService = new NotificationService();
  }

  /**
   * Configura jobs agendados (cron jobs)
   */
  private setupCronJobs(): void {
    // Job para verificar visitantes expirados (a cada hora)
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Iniciando verificação de visitantes expirados');
        const expirados = await this.visitanteService.verificarVisitantesExpirados();
        logger.info(`Verificação concluída: ${expirados} visitantes expirados`);
      } catch (error) {
        logger.error('Erro na verificação de visitantes expirados:', error);
      }
    });

    // Job para limpeza de dados (diário às 2h)
    cron.schedule(config.cleanupCronSchedule, async () => {
      try {
        logger.info('Iniciando limpeza automática de dados');
        
        // Limpeza de arquivos antigos
        const arquivosRemovidos = await this.storageService.limparArquivosAntigos();
        
        // Limpeza de notificações antigas
        const notificacoesRemovidas = await this.notificationService.limparNotificacoes();
        
        // Limpeza de dados do banco via função SQL
        const { supabase } = await import('@/config/database');
        const { data: dadosRemovidos, error } = await supabase.rpc('limpar_dados_expirados');
        
        if (error) {
          throw error;
        }
        
        logger.info('Limpeza automática concluída', {
          arquivosRemovidos,
          notificacoesRemovidas,
          dadosRemovidos
        });
      } catch (error) {
        logger.error('Erro na limpeza automática:', error);
      }
    });

    // Job para notificar visitantes que vão expirar (diário às 8h)
    cron.schedule('0 8 * * *', async () => {
      try {
        logger.info('Verificando visitantes próximos ao vencimento');
        
        const { supabase } = await import('@/config/database');
        
        // Buscar visitantes que expiram nas próximas 24 horas
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        
        const { data: visitantesProximosVencimento, error } = await supabase
          .from('visitantes')
          .select('id, nome, morador_id, validade_fim')
          .in('status', ['liberado', 'ativo'])
          .lte('validade_fim', amanha.toISOString())
          .gt('validade_fim', new Date().toISOString());
        
        if (error) {
          throw error;
        }
        
        if (visitantesProximosVencimento && visitantesProximosVencimento.length > 0) {
          for (const visitante of visitantesProximosVencimento) {
            try {
              await this.notificationService.notificarExpiracaoProxima(
                visitante.id,
                visitante.morador_id
              );
            } catch (notifError) {
              logger.error(`Erro ao notificar expiração do visitante ${visitante.id}:`, notifError);
            }
          }
          
          logger.info(`Notificações de expiração enviadas para ${visitantesProximosVencimento.length} visitantes`);
        }
      } catch (error) {
        logger.error('Erro ao verificar visitantes próximos ao vencimento:', error);
      }
    });

    logger.info('Cron jobs configurados');
  }

  /**
   * Inicializa a aplicação
   */
  public async start(): Promise<void> {
    try {
      logger.info('Iniciando aplicação Visit Hub Backend...');
      
      // Configurar jobs agendados
      this.setupCronJobs();
      
      // Iniciar servidor
      await this.server.start();
      
      logger.info('Aplicação iniciada com sucesso!');
    } catch (error) {
      logger.error('Erro ao iniciar aplicação:', error);
      process.exit(1);
    }
  }

  /**
   * Retorna a instância do servidor para testes
   */
  public getServer(): Server {
    return this.server;
  }
}

// Exportar instância da aplicação
const app = new Application();

// Iniciar aplicação se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  app.start().catch(error => {
    logger.error('Falha crítica ao iniciar aplicação:', error);
    process.exit(1);
  });
}

export default app;

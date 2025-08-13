import express from 'express';
import path from 'path';
import { config, validateConfig } from '@/config';
import { logger } from '@/utils/logger';
import { 
  corsConfig,
  helmetConfig,
  rateLimit,
  validateContentType,
  detectSuspiciousActivity,
  securityHeaders,
  validateBodySize,
  securityLogger
} from '@/middlewares/security';
import { logAccess } from '@/middlewares/auth';
import { handleUploadError } from '@/middlewares/upload';

// Importar rotas (serão criadas em seguida)
import authRoutes from '@/routes/auth';
import visitanteRoutes from '@/routes/visitante';
import adminRoutes from '@/routes/admin';
import publicRoutes from '@/routes/public';

// Serviços para inicialização
import { StorageService } from '@/services/storageService';
import { HikvisionService } from '@/services/hikvisionService';

class Server {
  private app: express.Application;
  private storageService: StorageService;
  private hikvisionService: HikvisionService;

  constructor() {
    this.app = express();
    this.storageService = new StorageService();
    this.hikvisionService = new HikvisionService();
    
    this.validateEnvironment();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Valida configurações obrigatórias
   */
  private validateEnvironment(): void {
    try {
      validateConfig();
      logger.info('Configurações validadas com sucesso');
    } catch (error) {
      logger.error('Erro nas configurações:', error);
      process.exit(1);
    }
  }

  /**
   * Configura middlewares globais
   */
  private setupMiddlewares(): void {
    // Middlewares de segurança (aplicados primeiro)
    this.app.use(securityHeaders);
    this.app.use(helmetConfig);
    this.app.use(corsConfig);
    
    // Rate limiting
    this.app.use(rateLimit());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Validações de segurança
    this.app.use(validateBodySize());
    this.app.use(detectSuspiciousActivity);
    this.app.use(validateContentType(['application/json', 'multipart/form-data']));
    
    // Logging
    this.app.use(logAccess);
    this.app.use(securityLogger);

    logger.info('Middlewares configurados');
  }

  /**
   * Configura rotas da API
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.nodeEnv
      });
    });

    // Rotas da API
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/visitantes', visitanteRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/public', publicRoutes);

    // Rota 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
      });
    });

    logger.info('Rotas configuradas');
  }

  /**
   * Configura tratamento de erros
   */
  private setupErrorHandling(): void {
    // Handler específico para erros de upload
    this.app.use(handleUploadError);

    // Handler global de erros
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Erro não tratado:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
      });

      // Não expor detalhes do erro em produção
      const message = config.nodeEnv === 'production' 
        ? 'Erro interno do servidor' 
        : error.message;

      res.status(error.status || 500).json({
        success: false,
        message,
        ...(config.nodeEnv !== 'production' && { stack: error.stack })
      });
    });

    // Handlers para processo
    process.on('uncaughtException', (error) => {
      logger.error('Exceção não capturada:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Promise rejeitada não tratada:', { reason, promise });
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM recebido, encerrando servidor...');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT recebido, encerrando servidor...');
      this.shutdown();
    });

    logger.info('Tratamento de erros configurado');
  }

  /**
   * Inicializa serviços externos
   */
  private async initializeServices(): Promise<void> {
    try {
      // Configurar storage buckets
      await this.storageService.configurarBuckets();
      logger.info('Storage Service inicializado');

      // Testar conectividade Hikvision
      const hikvisionOnline = await this.hikvisionService.testarConectividade();
      if (hikvisionOnline) {
        logger.info('Hikvision Service conectado');
      } else {
        logger.warn('Hikvision Service offline - continuando sem integração');
      }

    } catch (error) {
      logger.error('Erro ao inicializar serviços:', error);
      // Continuar mesmo com erros nos serviços externos
    }
  }

  /**
   * Inicia o servidor
   */
  public async start(): Promise<void> {
    try {
      // Inicializar serviços
      await this.initializeServices();

      // Iniciar servidor HTTP
      const server = this.app.listen(config.port, () => {
        logger.info(`Servidor iniciado na porta ${config.port}`, {
          environment: config.nodeEnv,
          port: config.port,
          cors: config.corsOrigin
        });
      });

      // Configurar timeout
      server.timeout = 30000; // 30 segundos

      // Configurar keep-alive
      server.keepAliveTimeout = 5000; // 5 segundos
      server.headersTimeout = 6000; // 6 segundos

    } catch (error) {
      logger.error('Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }

  /**
   * Encerra o servidor graciosamente
   */
  private shutdown(): void {
    logger.info('Iniciando shutdown gracioso...');
    
    // Aqui você pode adicionar lógica para:
    // - Fechar conexões de banco de dados
    // - Finalizar jobs em andamento
    // - Limpar recursos
    
    setTimeout(() => {
      logger.info('Servidor encerrado');
      process.exit(0);
    }, 5000); // 5 segundos para cleanup
  }

  /**
   * Retorna a instância do Express para testes
   */
  public getApp(): express.Application {
    return this.app;
  }
}

// Inicializar servidor se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  const server = new Server();
  server.start().catch(error => {
    logger.error('Falha ao iniciar servidor:', error);
    process.exit(1);
  });
}

export default Server;

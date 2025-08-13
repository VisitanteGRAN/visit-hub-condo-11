import winston from 'winston';
import { config } from '@/config';

// Configuração do logger
const loggerConfig = {
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let metaString = '';
      if (Object.keys(meta).length > 0) {
        metaString = ` | ${JSON.stringify(meta)}`;
      }
      return `${timestamp} [${level.toUpperCase()}]: ${message}${metaString}`;
    })
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaString = '';
          if (Object.keys(meta).length > 0) {
            metaString = ` | ${JSON.stringify(meta, null, 2)}`;
          }
          return `${timestamp} [${level}]: ${message}${metaString}`;
        })
      )
    })
  ]
};

// Adiciona transport de arquivo apenas se não estiver em ambiente de teste
if (config.nodeEnv !== 'test') {
  loggerConfig.transports.push(
    new winston.transports.File({
      filename: config.logFile,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      )
    })
  );
}

export const logger = winston.createLogger(loggerConfig);

// Interface para logs estruturados
export interface LogContext {
  userId?: string;
  visitanteId?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  [key: string]: any;
}

// Funções auxiliares para logs específicos do domínio
export const logAuth = {
  login: (userId: string, ip: string, success: boolean) => {
    logger.info('Tentativa de login', {
      userId,
      ip,
      success,
      action: 'login'
    });
  },

  logout: (userId: string, ip: string) => {
    logger.info('Logout realizado', {
      userId,
      ip,
      action: 'logout'
    });
  },

  tokenExpired: (userId: string) => {
    logger.warn('Token expirado', {
      userId,
      action: 'token_expired'
    });
  }
};

export const logVisitante = {
  created: (visitanteId: string, moradorId: string) => {
    logger.info('Visitante criado', {
      visitanteId,
      moradorId,
      action: 'visitante_created'
    });
  },

  updated: (visitanteId: string, changes: string[]) => {
    logger.info('Visitante atualizado', {
      visitanteId,
      changes,
      action: 'visitante_updated'
    });
  },

  expired: (visitanteId: string) => {
    logger.info('Visitante expirado', {
      visitanteId,
      action: 'visitante_expired'
    });
  },

  accessed: (visitanteId: string, tipo: 'entrada' | 'saida') => {
    logger.info('Acesso de visitante registrado', {
      visitanteId,
      tipo,
      action: 'visitante_access'
    });
  }
};

export const logHikvision = {
  syncStart: (count: number) => {
    logger.info('Iniciando sincronização Hikvision', {
      count,
      action: 'hikvision_sync_start'
    });
  },

  syncComplete: (success: number, errors: number) => {
    logger.info('Sincronização Hikvision concluída', {
      success,
      errors,
      action: 'hikvision_sync_complete'
    });
  },

  error: (operation: string, error: Error) => {
    logger.error('Erro na operação Hikvision', {
      operation,
      error: error.message,
      stack: error.stack,
      action: 'hikvision_error'
    });
  }
};

export const logSecurity = {
  invalidAccess: (ip: string, path: string, reason: string) => {
    logger.warn('Tentativa de acesso inválido', {
      ip,
      path,
      reason,
      action: 'invalid_access'
    });
  },

  rateLimitHit: (ip: string, path: string) => {
    logger.warn('Rate limit atingido', {
      ip,
      path,
      action: 'rate_limit_hit'
    });
  },

  suspiciousActivity: (ip: string, description: string) => {
    logger.warn('Atividade suspeita detectada', {
      ip,
      description,
      action: 'suspicious_activity'
    });
  }
};

// Logger para requisições HTTP
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  ip: string,
  userAgent?: string
) => {
  logger.info('HTTP Request', {
    method,
    url,
    statusCode,
    duration,
    ip,
    userAgent,
    action: 'http_request'
  });
};


import { logger } from '@/utils/secureLogger';

// 🔐 SECURE LOGGER - Remove dados sensíveis dos logs
// Substitui console.log por versão segura

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class SecureLogger {
  private isDevelopment = import.meta.env.DEV;
  
  // Campos que NUNCA devem aparecer nos logs
  private sensitiveFields = [
    'password',
    'senha',
    'senha_hash',
    'cpf',
    'telefone',
    'rg',
    'token',
    'access_token',
    'refresh_token',
    'api_key',
    'secret',
    'private_key',
    'authorization',
    'cookie',
    'session',
    'placa', // Placa do veículo também é sensível
  ];

  // Padrões regex para detectar dados sensíveis
  private sensitivePatterns = [
    /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/, // CPF
    /\(\d{2}\)\s?\d{4,5}-?\d{4}/, // Telefone
    /[A-Z]{3}-?\d{4}/, // Placa
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email (parcial)
  ];

  /**
   * Sanitiza objeto removendo campos sensíveis
   */
  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        // Remove campos sensíveis
        if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeObject(value);
        }
      }
      
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Sanitiza string removendo padrões sensíveis
   */
  private sanitizeString(str: string): string {
    let sanitized = str;
    
    // Mascarar padrões sensíveis
    this.sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    return sanitized;
  }

  /**
   * Log seguro que remove dados sensíveis
   */
  private log(level: LogLevel, message: string, data?: LogData): void {
    if (!this.isDevelopment && level === 'debug') {
      return; // Não logar debug em produção
    }

    const timestamp = new Date().toISOString();
    const sanitizedData = data ? this.sanitizeObject(data) : undefined;
    
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message: this.sanitizeString(message),
      ...(sanitizedData && { data: sanitizedData })
    };

    // Em desenvolvimento, usar console colorido
    if (this.isDevelopment) {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green  
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m'  // Red
      };
      
      const reset = '\x1b[0m';
      const color = colors[level] || '';
      
      console.log(`${color}[${level.toUpperCase()}]${reset} ${logEntry.message}`, 
        sanitizedData ? sanitizedData : '');
    } else {
      // Em produção, log estruturado sem console
      // Aqui poderia enviar para serviço de logging seguro
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Métodos públicos para diferentes níveis de log
   */
  debug(message: string, data?: LogData): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: LogData): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogData): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: LogData): void {
    this.log('error', message, data);
  }

  /**
   * Log específico para operações de autenticação
   */
  auth(operation: string, success: boolean, userEmail?: string): void {
    this.info(`🔐 Auth: ${operation}`, {
      success,
      userEmail: userEmail ? this.sanitizeString(userEmail) : undefined,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log específico para operações de banco
   */
  database(operation: string, table: string, success: boolean, error?: string): void {
    this.info(`🗄️ DB: ${operation} on ${table}`, {
      success,
      error: error ? this.sanitizeString(error) : undefined
    });
  }

  /**
   * Log específico para API calls
   */
  api(method: string, endpoint: string, status: number, duration?: number): void {
    this.info(`🌐 API: ${method} ${endpoint}`, {
      status,
      duration,
      success: status < 400
    });
  }
}

// Instância singleton
export const secureLogger = new SecureLogger();

// Substitutos seguros para console.log
export const logger = {
  debug: (message: string, data?: any) => secureLogger.debug(message, data),
  info: (message: string, data?: any) => secureLogger.info(message, data),
  warn: (message: string, data?: any) => secureLogger.warn(message, data),
  error: (message: string, data?: any) => secureLogger.error(message, data),
  auth: (operation: string, success: boolean, userEmail?: string) => 
    secureLogger.auth(operation, success, userEmail),
  database: (operation: string, table: string, success: boolean, error?: string) =>
    secureLogger.database(operation, table, success, error),
  api: (method: string, endpoint: string, status: number, duration?: number) =>
    secureLogger.api(method, endpoint, status, duration)
};

// Para facilitar migração gradual
export const safeLog = logger.info;
export const safeError = logger.error;
export const safeWarn = logger.warn;

export default secureLogger;

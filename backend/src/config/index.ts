import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Configurações gerais da aplicação
export const config = {
  // Servidor
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'seu-jwt-secret-super-seguro',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Upload de arquivos
  uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  
  // Configurações de segurança
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutos
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  
  // Configurações de visitantes
  defaultValidityDays: parseInt(process.env.DEFAULT_VALIDITY_DAYS || '1'),
  maxValidityDays: parseInt(process.env.MAX_VALIDITY_DAYS || '7'),
  linkExpirationHours: parseInt(process.env.LINK_EXPIRATION_HOURS || '24'),
  
  // Notificações
  pushNotificationEnabled: process.env.PUSH_NOTIFICATION_ENABLED === 'true',
  
  // Logs
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/app.log',
  
  // LGPD
  lgpdRetentionDays: parseInt(process.env.LGPD_RETENTION_DAYS || '365'),
  
  // Cron jobs
  cleanupCronSchedule: process.env.CLEANUP_CRON_SCHEDULE || '0 2 * * *', // Todo dia às 2h
  
  // Hikvision
  hikvisionTimeout: parseInt(process.env.HIKVISION_TIMEOUT || '30000'), // 30 segundos
  hikvisionRetries: parseInt(process.env.HIKVISION_RETRIES || '3'),
};

// Validação de configurações críticas
export function validateConfig(): void {
  const requiredVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${missing.join(', ')}`);
  }
  
  if (config.nodeEnv === 'production' && config.jwtSecret === 'seu-jwt-secret-super-seguro') {
    throw new Error('JWT_SECRET deve ser definido em produção');
  }
}

export * from './database';
export * from './hikvision';


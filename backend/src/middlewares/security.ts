import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '@/config';
import { logger, logSecurity } from '@/utils/logger';

// Configuração do CORS
export const corsConfig = cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.corsOrigin.split(',');
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('Origem CORS não permitida', { origin });
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 horas
});

// Configuração do Helmet para segurança
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// Rate limiting simples (em produção, use Redis)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export const rateLimit = (
  windowMs: number = config.rateLimitWindow,
  maxRequests: number = config.rateLimitMax
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    // Limpar entradas expiradas
    Object.keys(rateLimitStore).forEach(key => {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key];
      }
    });
    
    // Verificar rate limit para o cliente atual
    if (!rateLimitStore[clientId]) {
      rateLimitStore[clientId] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      rateLimitStore[clientId].count++;
    }
    
    const clientData = rateLimitStore[clientId];
    
    // Headers informativos
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - clientData.count).toString(),
      'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
    });
    
    if (clientData.count > maxRequests) {
      logSecurity.rateLimitHit(clientId, req.path);
      
      res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
      return;
    }
    
    next();
  };
};

// Middleware para validação de Content-Type
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      next();
      return;
    }
    
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      res.status(400).json({
        success: false,
        message: 'Content-Type header é obrigatório'
      });
      return;
    }
    
    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );
    
    if (!isAllowed) {
      res.status(415).json({
        success: false,
        message: `Content-Type não suportado. Use: ${allowedTypes.join(', ')}`
      });
      return;
    }
    
    next();
  };
};

// Middleware para detectar atividades suspeitas
export const detectSuspiciousActivity = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /(?:union|select|insert|delete|drop|create|alter|exec|script)/i,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i
  ];
  
  const checkString = (str: string): boolean => {
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };
  
  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkString(obj);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkObject(value));
    }
    
    return false;
  };
  
  // Verificar URL, query params e body
  const suspicious = [
    req.url,
    JSON.stringify(req.query),
    JSON.stringify(req.body)
  ].some(checkString);
  
  if (suspicious) {
    logSecurity.suspiciousActivity(
      req.ip || 'unknown',
      'Possível tentativa de injeção detectada'
    );
    
    res.status(400).json({
      success: false,
      message: 'Requisição inválida detectada'
    });
    return;
  }
  
  next();
};

// Middleware para adicionar headers de segurança customizados
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remover headers que expõem informações do servidor
  res.removeHeader('X-Powered-By');
  
  // Adicionar headers de segurança
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  });
  
  next();
};

// Middleware para validar tamanho do body
export const validateBodySize = (maxSize: number = config.uploadMaxSize) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      res.status(413).json({
        success: false,
        message: `Payload muito grande. Máximo permitido: ${maxSize} bytes`
      });
      return;
    }
    
    next();
  };
};

// Middleware para logging de segurança
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Log de tentativas de acesso a endpoints sensíveis
  const sensitiveEndpoints = ['/admin', '/config', '/users'];
  const isSensitive = sensitiveEndpoints.some(endpoint => 
    req.path.toLowerCase().includes(endpoint)
  );
  
  if (isSensitive) {
    logger.info('Acesso a endpoint sensível', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.userId || 'anonymous'
    });
  }
  
  next();
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { JWTPayload } from '@/types';
import { logger, logSecurity } from '@/utils/logger';

// Estender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Middleware de autenticação JWT
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logSecurity.invalidAccess(
      req.ip || 'unknown',
      req.path,
      'Token não fornecido'
    );
    res.status(401).json({
      success: false,
      message: 'Token de acesso requerido'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    req.user = decoded;
    
    logger.info('Token validado com sucesso', {
      userId: decoded.userId,
      perfil: decoded.perfil,
      path: req.path
    });
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logSecurity.invalidAccess(
        req.ip || 'unknown',
        req.path,
        'Token expirado'
      );
      res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logSecurity.invalidAccess(
        req.ip || 'unknown',
        req.path,
        'Token inválido'
      );
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
      return;
    }

    logger.error('Erro na validação do token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se é admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
    return;
  }

  if (req.user.perfil !== 'admin') {
    logSecurity.invalidAccess(
      req.ip || 'unknown',
      req.path,
      'Acesso negado - não é admin'
    );
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar este recurso.'
    });
    return;
  }

  next();
};

// Middleware para verificar se é morador
export const requireMorador = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
    return;
  }

  if (req.user.perfil !== 'morador') {
    logSecurity.invalidAccess(
      req.ip || 'unknown',
      req.path,
      'Acesso negado - não é morador'
    );
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas moradores podem acessar este recurso.'
    });
    return;
  }

  next();
};

// Middleware para verificar se é morador ou admin
export const requireMoradorOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
    return;
  }

  if (!['morador', 'admin'].includes(req.user.perfil)) {
    logSecurity.invalidAccess(
      req.ip || 'unknown',
      req.path,
      'Acesso negado - perfil inválido'
    );
    res.status(403).json({
      success: false,
      message: 'Acesso negado.'
    });
    return;
  }

  next();
};

// Middleware para verificar se o usuário pode acessar dados de uma unidade específica
export const checkUnidadeAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
    return;
  }

  // Admins podem acessar qualquer unidade
  if (req.user.perfil === 'admin') {
    next();
    return;
  }

  // Verificar se o morador está tentando acessar dados de sua própria unidade
  // Esta verificação pode ser expandida conforme necessário
  next();
};

// Middleware para logs de acesso
export const logAccess = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userInfo = req.user ? {
      userId: req.user.userId,
      perfil: req.user.perfil
    } : { userId: 'anonymous', perfil: 'none' };

    logger.info('Request processado', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      ...userInfo
    });
  });

  next();
};

// Middleware para validação de token de convite (usado por visitantes)
export const validateInviteToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64 || !/^[a-f0-9]+$/.test(token)) {
      res.status(400).json({
        success: false,
        message: 'Token de convite inválido'
      });
      return;
    }

    // Aqui você adicionaria a lógica para verificar se o token existe no banco
    // Por agora, vamos apenas validar o formato
    next();
  } catch (error) {
    logger.error('Erro na validação do token de convite:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

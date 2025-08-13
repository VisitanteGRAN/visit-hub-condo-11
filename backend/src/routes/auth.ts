import { Router, Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import { authenticateToken, requireAdmin } from '@/middlewares/auth';
import { loginSchema, criarUsuarioSchema } from '@/utils/validation';
import { logger } from '@/utils/logger';
import { ApiResponse, LoginRequest, LoginResponse } from '@/types';

const router = Router();
const authService = new AuthService();

/**
 * POST /api/auth/login
 * Realiza login do usuário
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar dados de entrada
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationResult.error.errors
      });
      return;
    }

    const loginData: LoginRequest = validationResult.data;
    const clientIP = req.ip || 'unknown';

    // Realizar login
    const loginResponse: LoginResponse = await authService.login(loginData, clientIP);

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: loginResponse,
      message: 'Login realizado com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro no endpoint de login:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(401).json(response);
  }
});

/**
 * POST /api/auth/logout
 * Realiza logout do usuário (opcional - JWT é stateless)
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // Para JWT stateless, o logout é feito no frontend removendo o token
    // Aqui você pode adicionar lógica para blacklist de tokens se necessário
    
    logger.info('Logout realizado', {
      userId: req.user?.userId,
      ip: req.ip
    });

    const response: ApiResponse = {
      success: true,
      message: 'Logout realizado com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro no logout:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Erro no logout'
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/auth/me
 * Retorna informações do usuário autenticado
 */
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    
    const usuario = await authService.buscarUsuarioPorId(userId);
    
    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: usuario
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao buscar dados do usuário:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * PUT /api/auth/me
 * Atualiza dados do usuário autenticado
 */
router.put('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { nome, email, unidade } = req.body;

    // Validar dados (apenas campos permitidos para auto-atualização)
    const dadosPermitidos = { nome, email, unidade };
    
    // Remover campos undefined
    Object.keys(dadosPermitidos).forEach(key => {
      if (dadosPermitidos[key as keyof typeof dadosPermitidos] === undefined) {
        delete dadosPermitidos[key as keyof typeof dadosPermitidos];
      }
    });

    if (Object.keys(dadosPermitidos).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Nenhum dado válido fornecido para atualização'
      });
      return;
    }

    const usuarioAtualizado = await authService.atualizarUsuario(
      userId,
      dadosPermitidos,
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: usuarioAtualizado,
      message: 'Dados atualizados com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao atualizar dados do usuário:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(400).json(response);
  }
});

/**
 * PUT /api/auth/change-password
 * Altera senha do usuário autenticado
 */
router.put('/change-password', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
      return;
    }

    await authService.alterarSenha(userId, senhaAtual, novaSenha);

    const response: ApiResponse = {
      success: true,
      message: 'Senha alterada com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao alterar senha:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(400).json(response);
  }
});

/**
 * POST /api/auth/users
 * Cria novo usuário (apenas admins)
 */
router.post('/users', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar dados de entrada
    const validationResult = criarUsuarioSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationResult.error.errors
      });
      return;
    }

    const adminId = req.user!.userId;
    const dadosUsuario = validationResult.data;

    const novoUsuario = await authService.criarUsuario(
      {
        ...dadosUsuario,
        senha_hash: dadosUsuario.senha, // Será hashada no service
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      adminId
    );

    // Remover senha da resposta
    const { senha_hash, ...usuarioSemSenha } = novoUsuario;

    const response: ApiResponse = {
      success: true,
      data: usuarioSemSenha,
      message: 'Usuário criado com sucesso'
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Erro ao criar usuário:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(400).json(response);
  }
});

/**
 * GET /api/auth/users
 * Lista usuários (apenas admins)
 */
router.get('/users', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const { perfil, ativo, unidade } = req.query;

    const filtros = {
      ...(perfil && { perfil: perfil as 'morador' | 'admin' }),
      ...(ativo !== undefined && { ativo: ativo === 'true' }),
      ...(unidade && { unidade: unidade as string })
    };

    const usuarios = await authService.listarUsuarios(adminId, filtros);

    const response: ApiResponse = {
      success: true,
      data: usuarios
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao listar usuários:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * PUT /api/auth/users/:id/deactivate
 * Desativa usuário (apenas admins)
 */
router.put('/users/:id/deactivate', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const usuarioId = req.params.id;

    await authService.desativarUsuario(usuarioId, adminId);

    const response: ApiResponse = {
      success: true,
      message: 'Usuário desativado com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao desativar usuário:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(400).json(response);
  }
});

/**
 * POST /api/auth/verify-token
 * Verifica se um token JWT é válido
 */
router.post('/verify-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token é obrigatório'
      });
      return;
    }

    const payload = authService.verifyToken(token);

    const response: ApiResponse = {
      success: true,
      data: {
        valid: true,
        payload: {
          userId: payload.userId,
          email: payload.email,
          perfil: payload.perfil,
          exp: payload.exp
        }
      }
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: true, // Success true mas valid false para distinguir de erro de servidor
      data: {
        valid: false,
        message: error instanceof Error ? error.message : 'Token inválido'
      }
    };

    res.json(response);
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { VisitanteService } from '@/services/visitanteService';
import { authenticateToken, requireMorador, validateInviteToken } from '@/middlewares/auth';
import { uploadSelfie, uploadDocumento, processImage, validateSelfie } from '@/middlewares/upload';
import { criarVisitanteSchema, criarLinkConviteSchema } from '@/utils/validation';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';

const router = Router();
const visitanteService = new VisitanteService();

/**
 * POST /api/visitantes/links
 * Cria um link de convite para visitante (apenas moradores)
 */
router.post('/links', authenticateToken, requireMorador, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar dados de entrada
    const validationResult = criarLinkConviteSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationResult.error.errors
      });
      return;
    }

    const moradorId = req.user!.userId;
    const { nome_visitante, validade_dias } = validationResult.data;

    const linkConvite = await visitanteService.criarLinkConvite(
      moradorId,
      nome_visitante,
      validade_dias
    );

    const response: ApiResponse = {
      success: true,
      data: {
        id: linkConvite.id,
        token: linkConvite.token,
        nome_visitante: linkConvite.nome_visitante,
        validade_dias: linkConvite.validade_dias,
        expires_at: linkConvite.expires_at,
        url: `${req.protocol}://${req.get('host')}/api/public/convite/${linkConvite.token}`
      },
      message: 'Link de convite criado com sucesso'
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Erro ao criar link de convite:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(400).json(response);
  }
});

/**
 * GET /api/visitantes/links
 * Lista links de convite do morador
 */
router.get('/links', authenticateToken, requireMorador, async (req: Request, res: Response): Promise<void> => {
  try {
    const moradorId = req.user!.userId;

    // Buscar links do morador via serviço ou diretamente do banco
    // Por simplicidade, vou fazer uma consulta direta aqui
    const { supabase } = await import('@/config/database');
    
    const { data: links, error } = await supabase
      .from('links_convite')
      .select('*')
      .eq('morador_id', moradorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar links: ${error.message}`);
    }

    const response: ApiResponse = {
      success: true,
      data: links || []
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao listar links de convite:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * DELETE /api/visitantes/links/:id
 * Cancela um link de convite
 */
router.delete('/links/:id', authenticateToken, requireMorador, async (req: Request, res: Response): Promise<void> => {
  try {
    const moradorId = req.user!.userId;
    const linkId = req.params.id;

    const { supabase } = await import('@/config/database');
    
    // Verificar se o link pertence ao morador
    const { data: link, error: findError } = await supabase
      .from('links_convite')
      .select('id, usado')
      .eq('id', linkId)
      .eq('morador_id', moradorId)
      .single();

    if (findError || !link) {
      res.status(404).json({
        success: false,
        message: 'Link não encontrado'
      });
      return;
    }

    if (link.usado) {
      res.status(400).json({
        success: false,
        message: 'Não é possível cancelar link que já foi usado'
      });
      return;
    }

    // Marcar como expirado
    const { error: updateError } = await supabase
      .from('links_convite')
      .update({ expirado: true })
      .eq('id', linkId);

    if (updateError) {
      throw new Error(`Erro ao cancelar link: ${updateError.message}`);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Link cancelado com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao cancelar link:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/visitantes
 * Lista visitantes do morador autenticado
 */
router.get('/', authenticateToken, requireMorador, async (req: Request, res: Response): Promise<void> => {
  try {
    const moradorId = req.user!.userId;
    const { status, data_inicio, data_fim } = req.query;

    const filtros = {
      ...(status && { status: status as string }),
      ...(data_inicio && { dataInicio: new Date(data_inicio as string) }),
      ...(data_fim && { dataFim: new Date(data_fim as string) })
    };

    const visitantes = await visitanteService.listarVisitantesMorador(moradorId, filtros);

    const response: ApiResponse = {
      success: true,
      data: visitantes
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao listar visitantes:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * PUT /api/visitantes/:id/liberar
 * Libera um visitante (ativa no Hikvision)
 */
router.put('/:id/liberar', authenticateToken, requireMorador, async (req: Request, res: Response): Promise<void> => {
  try {
    const moradorId = req.user!.userId;
    const visitanteId = req.params.id;

    await visitanteService.liberarVisitante(visitanteId, moradorId);

    const response: ApiResponse = {
      success: true,
      message: 'Visitante liberado com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao liberar visitante:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(400).json(response);
  }
});

/**
 * PUT /api/visitantes/:id/cancelar
 * Cancela um visitante
 */
router.put('/:id/cancelar', authenticateToken, requireMorador, async (req: Request, res: Response): Promise<void> => {
  try {
    const moradorId = req.user!.userId;
    const visitanteId = req.params.id;
    const { motivo } = req.body;

    await visitanteService.cancelarVisitante(visitanteId, moradorId, motivo);

    const response: ApiResponse = {
      success: true,
      message: 'Visitante cancelado com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao cancelar visitante:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(400).json(response);
  }
});

/**
 * POST /api/visitantes/:id/selfie
 * Adiciona selfie a um visitante
 */
router.post('/:id/selfie', 
  uploadSelfie,
  processImage,
  validateSelfie,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const visitanteId = req.params.id;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Arquivo de selfie é obrigatório'
        });
        return;
      }

      const selfieUrl = await visitanteService.adicionarSelfie(visitanteId, req.file);

      const response: ApiResponse = {
        success: true,
        data: {
          selfieUrl,
          metadata: (req as any).imageMetadata
        },
        message: 'Selfie adicionada com sucesso'
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao adicionar selfie:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };

      res.status(400).json(response);
    }
  }
);

/**
 * POST /api/visitantes/:id/documento
 * Adiciona documento a um visitante
 */
router.post('/:id/documento',
  uploadDocumento,
  processImage,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const visitanteId = req.params.id;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Arquivo de documento é obrigatório'
        });
        return;
      }

      const documentoUrl = await visitanteService.adicionarDocumento(visitanteId, req.file);

      const response: ApiResponse = {
        success: true,
        data: {
          documentoUrl,
          metadata: (req as any).imageMetadata
        },
        message: 'Documento adicionado com sucesso'
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao adicionar documento:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };

      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/visitantes/:id
 * Busca detalhes de um visitante específico
 */
router.get('/:id', authenticateToken, requireMorador, async (req: Request, res: Response): Promise<void> => {
  try {
    const moradorId = req.user!.userId;
    const visitanteId = req.params.id;

    const { supabase } = await import('@/config/database');
    
    const { data: visitante, error } = await supabase
      .from('visitantes')
      .select('*')
      .eq('id', visitanteId)
      .eq('morador_id', moradorId)
      .single();

    if (error || !visitante) {
      res.status(404).json({
        success: false,
        message: 'Visitante não encontrado'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: visitante
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao buscar visitante:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/visitantes/:id/logs
 * Busca logs de acesso de um visitante
 */
router.get('/:id/logs', authenticateToken, requireMorador, async (req: Request, res: Response): Promise<void> => {
  try {
    const moradorId = req.user!.userId;
    const visitanteId = req.params.id;

    const { supabase } = await import('@/config/database');
    
    // Verificar se o visitante pertence ao morador
    const { data: visitante, error: visitanteError } = await supabase
      .from('visitantes')
      .select('id')
      .eq('id', visitanteId)
      .eq('morador_id', moradorId)
      .single();

    if (visitanteError || !visitante) {
      res.status(404).json({
        success: false,
        message: 'Visitante não encontrado'
      });
      return;
    }

    // Buscar logs
    const { data: logs, error: logsError } = await supabase
      .from('logs_acesso')
      .select('*')
      .eq('visitante_id', visitanteId)
      .order('data_hora', { ascending: false });

    if (logsError) {
      throw new Error(`Erro ao buscar logs: ${logsError.message}`);
    }

    const response: ApiResponse = {
      success: true,
      data: logs || []
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao buscar logs de acesso:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

export default router;

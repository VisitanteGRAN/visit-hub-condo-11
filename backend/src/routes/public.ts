import { Router, Request, Response } from 'express';
import { VisitanteService } from '@/services/visitanteService';
import { validateInviteToken } from '@/middlewares/auth';
import { uploadSelfie, uploadDocumento, processImage, validateSelfie } from '@/middlewares/upload';
import { criarVisitanteSchema } from '@/utils/validation';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';

const router = Router();
const visitanteService = new VisitanteService();

/**
 * GET /api/public/convite/:token
 * Valida um token de convite e retorna informações
 */
router.get('/convite/:token', validateInviteToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token;

    const linkConvite = await visitanteService.validarTokenConvite(token);

    const response: ApiResponse = {
      success: true,
      data: {
        nome_visitante: linkConvite.nome_visitante,
        validade_dias: linkConvite.validade_dias,
        morador: {
          nome: linkConvite.usuarios.nome,
          unidade: linkConvite.usuarios.unidade
        },
        expires_at: linkConvite.expires_at
      },
      message: 'Token válido'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao validar token de convite:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(400).json(response);
  }
});

/**
 * POST /api/public/convite/:token/visitante
 * Cria um visitante usando token de convite
 */
router.post('/convite/:token/visitante', validateInviteToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token;

    // Validar dados de entrada
    const validationResult = criarVisitanteSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationResult.error.errors
      });
      return;
    }

    const dadosVisitante = validationResult.data;

    const visitante = await visitanteService.criarVisitanteComToken(token, dadosVisitante);

    const response: ApiResponse = {
      success: true,
      data: {
        id: visitante.id,
        nome: visitante.nome,
        status: visitante.status,
        validade_inicio: visitante.validade_inicio,
        validade_fim: visitante.validade_fim
      },
      message: 'Visitante cadastrado com sucesso. Agora adicione sua selfie e documento.'
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Erro ao criar visitante com token:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(400).json(response);
  }
});

/**
 * POST /api/public/visitante/:id/selfie
 * Adiciona selfie a um visitante (sem autenticação, apenas para visitantes aguardando)
 */
router.post('/visitante/:id/selfie',
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

      // Verificar se visitante existe e está aguardando
      const { supabase } = await import('@/config/database');
      
      const { data: visitante, error } = await supabase
        .from('visitantes')
        .select('id, status')
        .eq('id', visitanteId)
        .single();

      if (error || !visitante) {
        res.status(404).json({
          success: false,
          message: 'Visitante não encontrado'
        });
        return;
      }

      if (visitante.status !== 'aguardando') {
        res.status(400).json({
          success: false,
          message: 'Selfie só pode ser adicionada para visitantes aguardando liberação'
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
      logger.error('Erro ao adicionar selfie (público):', error);
      
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };

      res.status(400).json(response);
    }
  }
);

/**
 * POST /api/public/visitante/:id/documento
 * Adiciona documento a um visitante (sem autenticação)
 */
router.post('/visitante/:id/documento',
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

      // Verificar se visitante existe e está aguardando
      const { supabase } = await import('@/config/database');
      
      const { data: visitante, error } = await supabase
        .from('visitantes')
        .select('id, status')
        .eq('id', visitanteId)
        .single();

      if (error || !visitante) {
        res.status(404).json({
          success: false,
          message: 'Visitante não encontrado'
        });
        return;
      }

      if (visitante.status !== 'aguardando') {
        res.status(400).json({
          success: false,
          message: 'Documento só pode ser adicionado para visitantes aguardando liberação'
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
      logger.error('Erro ao adicionar documento (público):', error);
      
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };

      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/public/visitante/:id/status
 * Consulta status de um visitante (sem autenticação, apenas informações básicas)
 */
router.get('/visitante/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const visitanteId = req.params.id;

    const { supabase } = await import('@/config/database');
    
    const { data: visitante, error } = await supabase
      .from('visitantes')
      .select('id, nome, status, validade_inicio, validade_fim, selfie_url, documento_url')
      .eq('id', visitanteId)
      .single();

    if (error || !visitante) {
      res.status(404).json({
        success: false,
        message: 'Visitante não encontrado'
      });
      return;
    }

    // Retornar apenas informações básicas de status
    const response: ApiResponse = {
      success: true,
      data: {
        id: visitante.id,
        nome: visitante.nome,
        status: visitante.status,
        validade_inicio: visitante.validade_inicio,
        validade_fim: visitante.validade_fim,
        tem_selfie: !!visitante.selfie_url,
        tem_documento: !!visitante.documento_url,
        pronto_para_liberacao: !!(visitante.selfie_url && visitante.documento_url)
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao consultar status do visitante:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/public/health
 * Health check público
 */
router.get('/health', (req: Request, res: Response): void => {
  res.json({
    status: 'OK',
    service: 'Visit Hub API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /api/public/configuracoes
 * Retorna configurações públicas do sistema
 */
router.get('/configuracoes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { supabase } = await import('@/config/database');
    
    const { data: configs, error } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', [
        'sistema_nome',
        'validade_maxima_dias',
        'upload_max_size_mb',
        'documento_tipos_aceitos',
        'horario_funcionamento'
      ]);

    if (error) {
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }

    // Converter array em objeto
    const configuracoes = configs?.reduce((acc, config) => {
      let valor = config.valor;
      
      // Tentar parsear JSON se aplicável
      try {
        if (config.valor.startsWith('{') || config.valor.startsWith('[')) {
          valor = JSON.parse(config.valor);
        }
      } catch {
        // Manter valor original se não for JSON válido
      }
      
      acc[config.chave] = valor;
      return acc;
    }, {} as Record<string, any>) || {};

    const response: ApiResponse = {
      success: true,
      data: configuracoes
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao buscar configurações públicas:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/public/contato
 * Endpoint para contato/suporte (opcional)
 */
router.post('/contato', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, email, mensagem, assunto } = req.body;

    if (!nome || !email || !mensagem) {
      res.status(400).json({
        success: false,
        message: 'Nome, email e mensagem são obrigatórios'
      });
      return;
    }

    // Aqui você implementaria o envio do email/notificação para admin
    logger.info('Mensagem de contato recebida', {
      nome,
      email,
      assunto,
      ip: req.ip
    });

    const response: ApiResponse = {
      success: true,
      message: 'Mensagem enviada com sucesso. Entraremos em contato em breve.'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao processar contato:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

export default router;

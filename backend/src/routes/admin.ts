import { Router, Request, Response } from 'express';
import { VisitanteService } from '@/services/visitanteService';
import { HikvisionService } from '@/services/hikvisionService';
import { StorageService } from '@/services/storageService';
import { NotificationService } from '@/services/notificationService';
import { authenticateToken, requireAdmin } from '@/middlewares/auth';
import { logger } from '@/utils/logger';
import { ApiResponse, PaginatedResponse } from '@/types';

const router = Router();
const visitanteService = new VisitanteService();
const hikvisionService = new HikvisionService();
const storageService = new StorageService();
const notificationService = new NotificationService();

/**
 * GET /api/admin/dashboard
 * Retorna estatísticas gerais do sistema
 */
router.get('/dashboard', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { supabase } = await import('@/config/database');
    
    // Executar função de estatísticas do banco
    const { data: stats, error } = await supabase.rpc('estatisticas_sistema');
    
    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    // Estatísticas adicionais
    const storageStats = await storageService.obterEstatisticasStorage();
    const hikvisionStatus = await hikvisionService.testarConectividade();

    const response: ApiResponse = {
      success: true,
      data: {
        sistema: stats,
        storage: storageStats,
        integracao: {
          hikvision_online: hikvisionStatus
        },
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao buscar estatísticas do dashboard:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/admin/visitantes
 * Lista todos os visitantes com filtros e paginação
 */
router.get('/visitantes', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      status, 
      unidade, 
      data_inicio, 
      data_fim,
      search 
    } = req.query;

    const { supabase } = await import('@/config/database');
    
    let query = supabase
      .from('vw_visitantes_detalhado')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }
    if (unidade) {
      query = query.eq('unidade', unidade);
    }
    if (data_inicio) {
      query = query.gte('created_at', data_inicio);
    }
    if (data_fim) {
      query = query.lte('created_at', data_fim);
    }
    if (search) {
      query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%,morador_nome.ilike.%${search}%`);
    }

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    query = query
      .range(offset, offset + limitNum - 1)
      .order('created_at', { ascending: false });

    const { data: visitantes, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao listar visitantes: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limitNum);

    const response: PaginatedResponse<typeof visitantes> = {
      success: true,
      data: visitantes || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao listar visitantes (admin):', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/admin/logs-acesso
 * Lista logs de acesso com filtros
 */
router.get('/logs-acesso', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      visitante_id, 
      tipo, 
      data_inicio, 
      data_fim 
    } = req.query;

    const { supabase } = await import('@/config/database');
    
    let query = supabase
      .from('vw_relatorio_acessos')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (visitante_id) {
      query = query.eq('visitante_id', visitante_id);
    }
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    if (data_inicio) {
      query = query.gte('data_hora', data_inicio);
    }
    if (data_fim) {
      query = query.lte('data_hora', data_fim);
    }

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    query = query
      .range(offset, offset + limitNum - 1)
      .order('data_hora', { ascending: false });

    const { data: logs, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao listar logs: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limitNum);

    const response: PaginatedResponse<typeof logs> = {
      success: true,
      data: logs || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao listar logs de acesso:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/admin/sync-hikvision
 * Força sincronização com Hikvision
 */
router.post('/sync-hikvision', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Buscar visitantes ativos
    const { supabase } = await import('@/config/database');
    
    const { data: visitantes, error } = await supabase
      .from('visitantes')
      .select('*')
      .in('status', ['liberado', 'ativo']);

    if (error) {
      throw new Error(`Erro ao buscar visitantes: ${error.message}`);
    }

    if (!visitantes || visitantes.length === 0) {
      res.json({
        success: true,
        message: 'Nenhum visitante ativo para sincronizar'
      });
      return;
    }

    // Executar sincronização
    await hikvisionService.sincronizarVisitantes(visitantes);

    logger.info('Sincronização Hikvision executada pelo admin', {
      adminId: req.user!.userId,
      visitantesCount: visitantes.length
    });

    const response: ApiResponse = {
      success: true,
      message: `Sincronização iniciada para ${visitantes.length} visitantes`
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro na sincronização Hikvision:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/admin/cleanup
 * Executa limpeza de dados antigos
 */
router.post('/cleanup', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { supabase } = await import('@/config/database');
    
    // Executar função de limpeza
    const { data: resultado, error } = await supabase.rpc('limpar_dados_expirados');
    
    if (error) {
      throw new Error(`Erro na limpeza: ${error.message}`);
    }

    // Limpeza de arquivos
    const arquivosRemovidos = await storageService.limparArquivosAntigos();
    
    // Limpeza de notificações
    const notificacoesRemovidas = await notificationService.limparNotificacoes();

    logger.info('Limpeza executada pelo admin', {
      adminId: req.user!.userId,
      visitantesRemovidos: resultado,
      arquivosRemovidos,
      notificacoesRemovidas
    });

    const response: ApiResponse = {
      success: true,
      data: {
        visitantes_removidos: resultado,
        arquivos_removidos: arquivosRemovidos,
        notificacoes_removidas: notificacoesRemovidas
      },
      message: 'Limpeza executada com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro na limpeza de dados:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/admin/configuracoes
 * Lista todas as configurações do sistema
 */
router.get('/configuracoes', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { supabase } = await import('@/config/database');
    
    const { data: configuracoes, error } = await supabase
      .from('configuracoes')
      .select('*')
      .order('chave');

    if (error) {
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }

    const response: ApiResponse = {
      success: true,
      data: configuracoes || []
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao listar configurações:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * PUT /api/admin/configuracoes/:chave
 * Atualiza uma configuração
 */
router.put('/configuracoes/:chave', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const chave = req.params.chave;
    const { valor, tipo, descricao } = req.body;

    if (!valor) {
      res.status(400).json({
        success: false,
        message: 'Valor é obrigatório'
      });
      return;
    }

    const { supabase } = await import('@/config/database');
    
    const { error } = await supabase
      .from('configuracoes')
      .upsert({
        chave,
        valor,
        tipo: tipo || 'string',
        descricao,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Erro ao atualizar configuração: ${error.message}`);
    }

    logger.info('Configuração atualizada', {
      adminId: req.user!.userId,
      chave,
      valor
    });

    const response: ApiResponse = {
      success: true,
      message: 'Configuração atualizada com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao atualizar configuração:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/admin/notificacao
 * Envia notificação para usuários
 */
router.post('/notificacao', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { usuario_ids, titulo, mensagem, tipo } = req.body;

    if (!usuario_ids || !titulo || !mensagem || !tipo) {
      res.status(400).json({
        success: false,
        message: 'usuario_ids, titulo, mensagem e tipo são obrigatórios'
      });
      return;
    }

    await notificationService.enviarNotificacaoEmLote(usuario_ids, {
      titulo,
      mensagem,
      tipo,
      dados_extras: { enviado_por_admin: req.user!.userId }
    });

    logger.info('Notificação em lote enviada pelo admin', {
      adminId: req.user!.userId,
      usuarios: usuario_ids.length,
      tipo
    });

    const response: ApiResponse = {
      success: true,
      message: `Notificação enviada para ${usuario_ids.length} usuários`
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao enviar notificação em lote:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/admin/expirar-visitantes
 * Força expiração de visitantes
 */
router.post('/expirar-visitantes', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const expirados = await visitanteService.verificarVisitantesExpirados();

    logger.info('Verificação de expiração executada pelo admin', {
      adminId: req.user!.userId,
      visitantesExpirados: expirados
    });

    const response: ApiResponse = {
      success: true,
      data: { visitantes_expirados: expirados },
      message: `${expirados} visitantes foram expirados`
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao expirar visitantes:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/admin/relatorios/acessos
 * Gera relatório de acessos
 */
router.get('/relatorios/acessos', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data_inicio, data_fim, formato = 'json' } = req.query;

    const { supabase } = await import('@/config/database');
    
    let query = supabase
      .from('vw_relatorio_acessos')
      .select('*');

    if (data_inicio) {
      query = query.gte('data_hora', data_inicio);
    }
    if (data_fim) {
      query = query.lte('data_hora', data_fim);
    }

    query = query.order('data_hora', { ascending: false });

    const { data: acessos, error } = await query;

    if (error) {
      throw new Error(`Erro ao gerar relatório: ${error.message}`);
    }

    // Se formato for CSV, converter para CSV (implementação simplificada)
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio-acessos.csv');
      
      // Implementar conversão CSV aqui
      const csv = 'Implementar conversão CSV';
      res.send(csv);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: acessos || []
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao gerar relatório de acessos:', error);
    
    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };

    res.status(500).json(response);
  }
});

export default router;

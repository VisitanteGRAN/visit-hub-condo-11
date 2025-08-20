import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { hikvisionAutomationService } from '../services/hikvisionAutomationService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/hikcentral/automation
 * Executa a automação do HikCentral para um visitante
 */
router.post('/automation', authenticateToken, async (req, res) => {
  try {
    const { visitor_id, visitor_data } = req.body;

    if (!visitor_id || !visitor_data) {
      return res.status(400).json({
        success: false,
        message: 'visitor_id e visitor_data são obrigatórios'
      });
    }

    logger.info(`🚀 Recebida solicitação de automação para visitante ${visitor_id}`);

    // Executar a automação
    const result = await hikvisionAutomationService.executeAutomation({
      visitor_id,
      visitor_data
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error(`❌ Erro na rota de automação: ${errorMessage}`);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/hikcentral/status/:visitorId
 * Verifica o status da automação de um visitante
 */
router.get('/status/:visitorId', authenticateToken, async (req, res) => {
  try {
    const { visitorId } = req.params;

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: 'visitorId é obrigatório'
      });
    }

    logger.info(`🔍 Verificando status da automação para visitante ${visitorId}`);

    const result = await hikvisionAutomationService.checkAutomationStatus(visitorId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error(`❌ Erro ao verificar status: ${errorMessage}`);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/hikcentral/automation/:visitorId
 * Cancela uma automação em andamento
 */
router.delete('/automation/:visitorId', authenticateToken, async (req, res) => {
  try {
    const { visitorId } = req.params;

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: 'visitorId é obrigatório'
      });
    }

    logger.info(`❌ Cancelando automação para visitante ${visitorId}`);

    const success = await hikvisionAutomationService.cancelAutomation(visitorId);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Automação cancelada com sucesso',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao cancelar automação',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error(`❌ Erro ao cancelar automação: ${errorMessage}`);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/hikcentral/health
 * Verifica a saúde da API de automação
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await hikvisionAutomationService.checkAutomationAPIHealth();

    if (isHealthy) {
      res.status(200).json({
        success: true,
        message: 'API de automação está funcionando',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'API de automação não está disponível',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error(`❌ Erro ao verificar saúde da API: ${errorMessage}`);
    
    res.status(503).json({
      success: false,
      message: 'API de automação não está disponível',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 
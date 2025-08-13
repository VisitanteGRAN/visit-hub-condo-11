import { supabase } from '@/config/database';
import { NotificacaoPush } from '@/types';
import { logger } from '@/utils/logger';
import { config } from '@/config';

export class NotificationService {
  /**
   * Envia uma notificação para um usuário
   */
  async enviarNotificacao(notificacao: NotificacaoPush): Promise<void> {
    try {
      if (!config.pushNotificationEnabled) {
        logger.info('Notificações desabilitadas', { notificacao });
        return;
      }

      // Verificar se usuário existe
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('id', notificacao.usuario_id)
        .single();

      if (usuarioError || !usuario) {
        throw new Error('Usuário não encontrado');
      }

      // Salvar notificação no banco
      const { data: notificacaoSalva, error: saveError } = await supabase
        .from('notificacoes')
        .insert([{
          usuario_id: notificacao.usuario_id,
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem,
          tipo: notificacao.tipo,
          dados_extras: notificacao.dados_extras || null
        }])
        .select()
        .single();

      if (saveError) {
        throw new Error(`Erro ao salvar notificação: ${saveError.message}`);
      }

      // Aqui você implementaria o envio real da notificação push
      // Por exemplo, usando Firebase Cloud Messaging, OneSignal, etc.
      await this.enviarPushNotification(usuario, notificacao);

      logger.info('Notificação enviada com sucesso', {
        notificacaoId: notificacaoSalva.id,
        usuarioId: notificacao.usuario_id,
        tipo: notificacao.tipo
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação:', error);
      throw error;
    }
  }

  /**
   * Envia notificação push real (implementação personalizada)
   */
  private async enviarPushNotification(
    usuario: { id: string; nome: string; email: string },
    notificacao: NotificacaoPush
  ): Promise<void> {
    try {
      // Esta é uma implementação mock
      // Em produção, você integraria com um serviço real de push notifications
      
      if (config.nodeEnv === 'development') {
        logger.info('Push notification simulada', {
          para: usuario.email,
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem
        });
        return;
      }

      // Implementação real seria algo como:
      /*
      const message = {
        notification: {
          title: notificacao.titulo,
          body: notificacao.mensagem
        },
        data: notificacao.dados_extras ? JSON.stringify(notificacao.dados_extras) : undefined,
        token: await this.getUserFCMToken(usuario.id)
      };

      await admin.messaging().send(message);
      */

      logger.info('Push notification enviada (implementação real necessária)', {
        usuarioId: usuario.id,
        tipo: notificacao.tipo
      });
    } catch (error) {
      logger.error('Erro no envio do push notification:', error);
      // Não propagar erro para não falhar o salvamento da notificação
    }
  }

  /**
   * Marca uma notificação como lida
   */
  async marcarComoLida(notificacaoId: string, usuarioId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', notificacaoId)
        .eq('usuario_id', usuarioId);

      if (error) {
        throw new Error(`Erro ao marcar notificação como lida: ${error.message}`);
      }

      logger.info('Notificação marcada como lida', { notificacaoId, usuarioId });
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  /**
   * Lista notificações de um usuário
   */
  async listarNotificacoes(
    usuarioId: string,
    filtros?: {
      apenasNaoLidas?: boolean;
      tipo?: string;
      limite?: number;
    }
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', usuarioId);

      if (filtros?.apenasNaoLidas) {
        query = query.eq('lida', false);
      }

      if (filtros?.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }

      const limite = filtros?.limite || 50;
      query = query.order('created_at', { ascending: false }).limit(limite);

      const { data: notificacoes, error } = await query;

      if (error) {
        throw new Error(`Erro ao listar notificações: ${error.message}`);
      }

      return notificacoes || [];
    } catch (error) {
      logger.error('Erro ao listar notificações:', error);
      throw error;
    }
  }

  /**
   * Conta notificações não lidas
   */
  async contarNaoLidas(usuarioId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .eq('lida', false);

      if (error) {
        throw new Error(`Erro ao contar notificações: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      logger.error('Erro ao contar notificações não lidas:', error);
      throw error;
    }
  }

  /**
   * Remove notificações antigas
   */
  async limparNotificacoes(diasRetencao: number = 30): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasRetencao);

      const { data: notificacoesRemovidas, error } = await supabase
        .from('notificacoes')
        .delete()
        .lt('created_at', dataLimite.toISOString())
        .select('id');

      if (error) {
        throw new Error(`Erro ao limpar notificações: ${error.message}`);
      }

      const quantidade = notificacoesRemovidas?.length || 0;

      logger.info('Notificações antigas removidas', {
        quantidade,
        diasRetencao
      });

      return quantidade;
    } catch (error) {
      logger.error('Erro ao limpar notificações antigas:', error);
      throw error;
    }
  }

  /**
   * Envia notificação para múltiplos usuários
   */
  async enviarNotificacaoEmLote(
    usuarioIds: string[],
    notificacao: Omit<NotificacaoPush, 'usuario_id'>
  ): Promise<void> {
    try {
      if (!config.pushNotificationEnabled) {
        logger.info('Notificações em lote desabilitadas', { notificacao });
        return;
      }

      const notificacoes = usuarioIds.map(usuarioId => ({
        usuario_id: usuarioId,
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        tipo: notificacao.tipo,
        dados_extras: notificacao.dados_extras || null
      }));

      // Salvar todas as notificações
      const { error } = await supabase
        .from('notificacoes')
        .insert(notificacoes);

      if (error) {
        throw new Error(`Erro ao salvar notificações em lote: ${error.message}`);
      }

      // Enviar push notifications (implementação real necessária)
      for (const usuarioId of usuarioIds) {
        try {
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('id, nome, email')
            .eq('id', usuarioId)
            .single();

          if (usuario) {
            await this.enviarPushNotification(usuario, {
              ...notificacao,
              usuario_id: usuarioId
            });
          }
        } catch (pushError) {
          logger.error(`Erro ao enviar push para usuário ${usuarioId}:`, pushError);
          // Continua com os outros usuários
        }
      }

      logger.info('Notificações em lote enviadas', {
        quantidade: usuarioIds.length,
        tipo: notificacao.tipo
      });
    } catch (error) {
      logger.error('Erro ao enviar notificações em lote:', error);
      throw error;
    }
  }

  /**
   * Notificações específicas do sistema de visitantes
   */
  async notificarVisitanteChegou(visitanteId: string, moradorId: string): Promise<void> {
    try {
      // Buscar dados do visitante
      const { data: visitante, error } = await supabase
        .from('visitantes')
        .select('nome, unidade')
        .eq('id', visitanteId)
        .single();

      if (error || !visitante) {
        throw new Error('Visitante não encontrado');
      }

      await this.enviarNotificacao({
        usuario_id: moradorId,
        titulo: 'Visitante na Portaria',
        mensagem: `${visitante.nome} chegou e está aguardando liberação na portaria.`,
        tipo: 'entrada_visitante',
        dados_extras: {
          visitanteId,
          visitanteNome: visitante.nome,
          unidade: visitante.unidade
        }
      });
    } catch (error) {
      logger.error('Erro ao notificar chegada de visitante:', error);
      throw error;
    }
  }

  /**
   * Notifica sobre visitante que irá expirar
   */
  async notificarExpiracaoProxima(visitanteId: string, moradorId: string): Promise<void> {
    try {
      // Buscar dados do visitante
      const { data: visitante, error } = await supabase
        .from('visitantes')
        .select('nome, validade_fim')
        .eq('id', visitanteId)
        .single();

      if (error || !visitante) {
        throw new Error('Visitante não encontrado');
      }

      const dataExpiracao = new Date(visitante.validade_fim);
      const dataFormatada = dataExpiracao.toLocaleDateString('pt-BR');

      await this.enviarNotificacao({
        usuario_id: moradorId,
        titulo: 'Acesso Expirando',
        mensagem: `O acesso de ${visitante.nome} expira em ${dataFormatada}.`,
        tipo: 'acesso_expirado',
        dados_extras: {
          visitanteId,
          visitanteNome: visitante.nome,
          dataExpiracao: visitante.validade_fim
        }
      });
    } catch (error) {
      logger.error('Erro ao notificar expiração próxima:', error);
      throw error;
    }
  }
}

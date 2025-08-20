import { supabase } from '@/config/database';
import { Visitante, LinkConvite, CriarVisitanteRequest, Usuario } from '@/types';
import { logger, logVisitante } from '@/utils/logger';
import { validarCPF, formatarCPF } from '@/utils/validation';
import { HikvisionService } from './hikvisionService';
import { StorageService } from './storageService';
import { NotificationService } from './notificationService';
import { hikvisionAutomationService } from './hikvisionAutomationService';
import crypto from 'crypto';

export class VisitanteService {
  private hikvisionService: HikvisionService;
  private storageService: StorageService;
  private notificationService: NotificationService;

  constructor() {
    this.hikvisionService = new HikvisionService();
    this.storageService = new StorageService();
    this.notificationService = new NotificationService();
  }

  /**
   * Cria um link de convite para um visitante
   */
  async criarLinkConvite(
    moradorId: string,
    nomeVisitante: string,
    validadeDias: number = 1
  ): Promise<LinkConvite> {
    try {
      // Verificar se o morador existe e está ativo
      const { data: morador, error: moradorError } = await supabase
        .from('usuarios')
        .select('id, nome, unidade, ativo')
        .eq('id', moradorId)
        .eq('ativo', true)
        .single();

      if (moradorError || !morador) {
        throw new Error('Morador não encontrado ou inativo');
      }

      // Verificar limite de links ativos por morador
      const { data: linksAtivos, error: linksError } = await supabase
        .from('links_convite')
        .select('id')
        .eq('morador_id', moradorId)
        .eq('expirado', false)
        .eq('usado', false);

      if (linksError) {
        throw new Error('Erro ao verificar links ativos');
      }

      const maxLinksAtivos = 5; // Configurável
      if (linksAtivos && linksAtivos.length >= maxLinksAtivos) {
        throw new Error(`Limite de ${maxLinksAtivos} links ativos atingido`);
      }

      // Gerar token único
      const token = crypto.randomBytes(32).toString('hex');
      
      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // Link válido por 1 dia

      // Criar link de convite
      const { data: linkConvite, error } = await supabase
        .from('links_convite')
        .insert([{
          token,
          morador_id: moradorId,
          nome_visitante: nomeVisitante,
          validade_dias: validadeDias,
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar link de convite: ${error.message}`);
      }

      logger.info('Link de convite criado', {
        linkId: linkConvite.id,
        moradorId,
        nomeVisitante,
        validadeDias
      });

      return linkConvite;
    } catch (error) {
      logger.error('Erro ao criar link de convite:', error);
      throw error;
    }
  }

  /**
   * Valida um token de convite
   */
  async validarTokenConvite(token: string): Promise<LinkConvite & { morador: Usuario }> {
    try {
      const { data: linkConvite, error } = await supabase
        .from('links_convite')
        .select(`
          *,
          usuarios!links_convite_morador_id_fkey (
            id, nome, email, unidade
          )
        `)
        .eq('token', token)
        .eq('expirado', false)
        .eq('usado', false)
        .single();

      if (error || !linkConvite) {
        throw new Error('Token de convite inválido ou expirado');
      }

      // Verificar se não expirou por tempo
      if (new Date() > new Date(linkConvite.expires_at)) {
        // Marcar como expirado
        await supabase
          .from('links_convite')
          .update({ expirado: true })
          .eq('id', linkConvite.id);

        throw new Error('Token de convite expirado');
      }

      return linkConvite as LinkConvite & { morador: Usuario };
    } catch (error) {
      logger.error('Erro ao validar token de convite:', error);
      throw error;
    }
  }

  /**
   * Cria um visitante usando um token de convite
   */
  async criarVisitanteComToken(
    token: string,
    dadosVisitante: CriarVisitanteRequest
  ): Promise<Visitante> {
    try {
      // Validar token
      const linkConvite = await this.validarTokenConvite(token);

      // Validar CPF
      if (!validarCPF(dadosVisitante.cpf)) {
        throw new Error('CPF inválido');
      }

      // Verificar se visitante já existe com mesmo CPF para o mesmo morador
      const cpfLimpo = dadosVisitante.cpf.replace(/\D/g, '');
      const { data: visitanteExistente } = await supabase
        .from('visitantes')
        .select('id, status')
        .eq('cpf', cpfLimpo)
        .eq('morador_id', linkConvite.morador_id)
        .in('status', ['aguardando', 'liberado', 'ativo']);

      if (visitanteExistente && visitanteExistente.length > 0) {
        throw new Error('Já existe um visitante ativo com este CPF para este morador');
      }

      // Calcular validade
      const validadeInicio = new Date();
      const validadeFim = new Date();
      validadeFim.setDate(validadeInicio.getDate() + linkConvite.validade_dias);

      // Criar visitante
      const { data: visitante, error } = await supabase
        .from('visitantes')
        .insert([{
          nome: dadosVisitante.nome,
          cpf: cpfLimpo,
          unidade: linkConvite.usuarios.unidade,
          morador_id: linkConvite.morador_id,
          link_convite_id: linkConvite.id,
          validade_inicio: validadeInicio.toISOString(),
          validade_fim: validadeFim.toISOString(),
          consentimento_lgpd: dadosVisitante.consentimento_lgpd,
          consentimento_data: new Date().toISOString(),
          status: 'aguardando'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar visitante: ${error.message}`);
      }

      // Marcar link como usado
      await supabase
        .from('links_convite')
        .update({ usado: true })
        .eq('id', linkConvite.id);

      // Log da criação
      logVisitante.created(visitante.id, linkConvite.morador_id);

      // Notificar morador
      await this.notificationService.enviarNotificacao({
        usuario_id: linkConvite.morador_id,
        titulo: 'Novo Visitante Cadastrado',
        mensagem: `${dadosVisitante.nome} completou o cadastro e aguarda liberação.`,
        tipo: 'cadastro_concluido',
        dados_extras: { visitanteId: visitante.id }
      });

      // Iniciar automação do HikCentral em background
      this.iniciarAutomacaoHikCentral(visitante).catch(error => {
        logger.error(`❌ Erro ao iniciar automação HikCentral para visitante ${visitante.id}:`, error);
      });

      logger.info('Visitante criado com sucesso via token', {
        visitanteId: visitante.id,
        token,
        moradorId: linkConvite.morador_id
      });

      return visitante;
    } catch (error) {
      logger.error('Erro ao criar visitante com token:', error);
      throw error;
    }
  }

  /**
   * Adiciona selfie a um visitante
   */
  async adicionarSelfie(visitanteId: string, arquivo: Express.Multer.File): Promise<string> {
    try {
      // Verificar se visitante existe
      const { data: visitante, error } = await supabase
        .from('visitantes')
        .select('id, status, morador_id')
        .eq('id', visitanteId)
        .single();

      if (error || !visitante) {
        throw new Error('Visitante não encontrado');
      }

      if (visitante.status !== 'aguardando') {
        throw new Error('Selfie só pode ser adicionada para visitantes aguardando liberação');
      }

      // Upload da selfie
      const selfieUrl = await this.storageService.uploadSelfie(visitanteId, arquivo);

      // Atualizar visitante
      const { error: updateError } = await supabase
        .from('visitantes')
        .update({
          selfie_url: selfieUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitanteId);

      if (updateError) {
        throw new Error(`Erro ao salvar selfie: ${updateError.message}`);
      }

      logger.info('Selfie adicionada com sucesso', { visitanteId });

      return selfieUrl;
    } catch (error) {
      logger.error('Erro ao adicionar selfie:', error);
      throw error;
    }
  }

  /**
   * Adiciona documento a um visitante
   */
  async adicionarDocumento(visitanteId: string, arquivo: Express.Multer.File): Promise<string> {
    try {
      // Verificar se visitante existe
      const { data: visitante, error } = await supabase
        .from('visitantes')
        .select('id, status')
        .eq('id', visitanteId)
        .single();

      if (error || !visitante) {
        throw new Error('Visitante não encontrado');
      }

      if (visitante.status !== 'aguardando') {
        throw new Error('Documento só pode ser adicionado para visitantes aguardando liberação');
      }

      // Upload do documento
      const documentoUrl = await this.storageService.uploadDocumento(visitanteId, arquivo);

      // Atualizar visitante
      const { error: updateError } = await supabase
        .from('visitantes')
        .update({
          documento_url: documentoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitanteId);

      if (updateError) {
        throw new Error(`Erro ao salvar documento: ${updateError.message}`);
      }

      logger.info('Documento adicionado com sucesso', { visitanteId });

      return documentoUrl;
    } catch (error) {
      logger.error('Erro ao adicionar documento:', error);
      throw error;
    }
  }

  /**
   * Libera um visitante (ativa no Hikvision)
   */
  async liberarVisitante(visitanteId: string, moradorId: string): Promise<void> {
    try {
      // Buscar visitante completo
      const { data: visitante, error } = await supabase
        .from('visitantes')
        .select('*')
        .eq('id', visitanteId)
        .eq('morador_id', moradorId)
        .single();

      if (error || !visitante) {
        throw new Error('Visitante não encontrado ou sem permissão');
      }

      if (visitante.status !== 'aguardando') {
        throw new Error('Visitante deve estar aguardando liberação');
      }

      if (!visitante.selfie_url) {
        throw new Error('Selfie é obrigatória para liberação');
      }

      // Criar visitante no Hikvision
      const hikvisionUserId = await this.hikvisionService.criarVisitante(visitante);

      // Adicionar dados faciais no Hikvision
      await this.hikvisionService.adicionarDadosFaciais(
        hikvisionUserId,
        visitante.selfie_url
      );

      // Atualizar status para liberado
      const { error: updateError } = await supabase
        .from('visitantes')
        .update({
          status: 'liberado',
          hikvision_user_id: hikvisionUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitanteId);

      if (updateError) {
        throw new Error(`Erro ao atualizar status: ${updateError.message}`);
      }

      // Log da liberação
      logVisitante.updated(visitanteId, ['status: liberado']);

      logger.info('Visitante liberado com sucesso', {
        visitanteId,
        moradorId,
        hikvisionUserId
      });
    } catch (error) {
      logger.error('Erro ao liberar visitante:', error);
      throw error;
    }
  }

  /**
   * Cancela um visitante
   */
  async cancelarVisitante(visitanteId: string, moradorId: string, motivo?: string): Promise<void> {
    try {
      // Verificar visitante
      const { data: visitante, error } = await supabase
        .from('visitantes')
        .select('id, status, hikvision_user_id')
        .eq('id', visitanteId)
        .eq('morador_id', moradorId)
        .single();

      if (error || !visitante) {
        throw new Error('Visitante não encontrado ou sem permissão');
      }

      // Se já foi criado no Hikvision, remover
      if (visitante.hikvision_user_id) {
        try {
          await this.hikvisionService.removerVisitante(visitante.hikvision_user_id);
        } catch (hikvisionError) {
          logger.warn('Erro ao remover visitante do Hikvision:', hikvisionError);
          // Continua com o cancelamento mesmo se houver erro no Hikvision
        }
      }

      // Atualizar status
      const { error: updateError } = await supabase
        .from('visitantes')
        .update({
          status: 'cancelado',
          observacoes: motivo || 'Cancelado pelo morador',
          updated_at: new Date().toISOString()
        })
        .eq('id', visitanteId);

      if (updateError) {
        throw new Error(`Erro ao cancelar visitante: ${updateError.message}`);
      }

      logger.info('Visitante cancelado', { visitanteId, moradorId, motivo });
    } catch (error) {
      logger.error('Erro ao cancelar visitante:', error);
      throw error;
    }
  }

  /**
   * Lista visitantes de um morador
   */
  async listarVisitantesMorador(
    moradorId: string,
    filtros?: {
      status?: string;
      dataInicio?: Date;
      dataFim?: Date;
    }
  ): Promise<Visitante[]> {
    try {
      let query = supabase
        .from('visitantes')
        .select('*')
        .eq('morador_id', moradorId);

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros?.dataInicio) {
        query = query.gte('created_at', filtros.dataInicio.toISOString());
      }

      if (filtros?.dataFim) {
        query = query.lte('created_at', filtros.dataFim.toISOString());
      }

      const { data: visitantes, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao listar visitantes: ${error.message}`);
      }

      return visitantes || [];
    } catch (error) {
      logger.error('Erro ao listar visitantes do morador:', error);
      throw error;
    }
  }

  /**
   * Verifica e expira visitantes automaticamente
   */
  async verificarVisitantesExpirados(): Promise<number> {
    try {
      // Buscar visitantes que devem ser expirados
      const { data: visitantesParaExpirar, error } = await supabase
        .from('visitantes')
        .select('id, hikvision_user_id')
        .in('status', ['liberado', 'ativo'])
        .lt('validade_fim', new Date().toISOString());

      if (error) {
        throw new Error(`Erro ao buscar visitantes expirados: ${error.message}`);
      }

      if (!visitantesParaExpirar || visitantesParaExpirar.length === 0) {
        return 0;
      }

      let expiradosComSucesso = 0;

      for (const visitante of visitantesParaExpirar) {
        try {
          // Remover do Hikvision se necessário
          if (visitante.hikvision_user_id) {
            await this.hikvisionService.removerVisitante(visitante.hikvision_user_id);
          }

          // Atualizar status no banco
          await supabase
            .from('visitantes')
            .update({
              status: 'expirado',
              updated_at: new Date().toISOString()
            })
            .eq('id', visitante.id);

          logVisitante.expired(visitante.id);
          expiradosComSucesso++;
        } catch (error) {
          logger.error(`Erro ao expirar visitante ${visitante.id}:`, error);
        }
      }

      logger.info(`Visitantes expirados automaticamente: ${expiradosComSucesso}/${visitantesParaExpirar.length}`);

      return expiradosComSucesso;
    } catch (error) {
      logger.error('Erro na verificação de visitantes expirados:', error);
      throw error;
    }
  }

  /**
   * Inicia a automação do HikCentral para um visitante
   */
  private async iniciarAutomacaoHikCentral(visitante: Visitante): Promise<void> {
    try {
      logger.info(`🚀 Iniciando automação HikCentral para visitante ${visitante.id}`);

      // Atualizar status para pending_hikcentral
      const { error: updateError } = await supabase
        .from('visitantes')
        .update({
          status: 'pending_hikcentral',
          updated_at: new Date().toISOString()
        })
        .eq('id', visitante.id);

      if (updateError) {
        throw new Error(`Erro ao atualizar status: ${updateError.message}`);
      }

      // Buscar dados completos do visitante
      const { data: visitanteCompleto, error: fetchError } = await supabase
        .from('visitantes')
        .select(`
          id,
          nome,
          cpf,
          telefone,
          email,
          foto_url,
          morador_id,
          usuarios!inner(nome as morador_nome, unidade)
        `)
        .eq('id', visitante.id)
        .single();

      if (fetchError || !visitanteCompleto) {
        throw new Error(`Erro ao buscar dados do visitante: ${fetchError?.message}`);
      }

      // Preparar dados para a automação
      const automationRequest = {
        visitor_id: visitante.id,
        visitor_data: {
          name: visitanteCompleto.nome,
          cpf: visitanteCompleto.cpf,
          phone: visitanteCompleto.telefone || '31999999999',
          email: visitanteCompleto.email,
          photo_url: visitanteCompleto.foto_url
        }
      };

      // Executar automação
      const result = await hikvisionAutomationService.executeAutomation(automationRequest);

      if (result.success) {
        // Atualizar status para success
        await supabase
          .from('visitantes')
          .update({
            status: 'hikcentral_success',
            hikcentral_id: result.hikcentral_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', visitante.id);

        logger.info(`✅ Automação HikCentral concluída com sucesso para visitante ${visitante.id}`);
        
        // Notificar morador sobre sucesso
        await this.notificationService.enviarNotificacao({
          usuario_id: visitanteCompleto.morador_id,
          titulo: 'Visitante Cadastrado no HikCentral',
          mensagem: `${visitanteCompleto.nome} foi cadastrado automaticamente no sistema de portaria.`,
          tipo: 'hikcentral_success',
          dados_extras: { visitanteId: visitante.id, hikcentralId: result.hikcentral_id }
        });
      } else {
        // Atualizar status para error
        await supabase
          .from('visitantes')
          .update({
            status: 'hikcentral_error',
            updated_at: new Date().toISOString()
          })
          .eq('id', visitante.id);

        logger.error(`❌ Falha na automação HikCentral para visitante ${visitante.id}: ${result.error}`);
        
        // Notificar morador sobre erro
        await this.notificationService.enviarNotificacao({
          usuario_id: visitanteCompleto.morador_id,
          titulo: 'Erro no Cadastro Automático',
          mensagem: `Não foi possível cadastrar ${visitanteCompleto.nome} automaticamente no sistema de portaria. Entre em contato com a administração.`,
          tipo: 'hikcentral_error',
          dados_extras: { visitanteId: visitante.id, error: result.error }
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(`❌ Erro na automação HikCentral para visitante ${visitante.id}: ${errorMessage}`);
      
      // Atualizar status para error
      try {
        await supabase
          .from('visitantes')
          .update({
            status: 'hikcentral_error',
            updated_at: new Date().toISOString()
          })
          .eq('id', visitante.id);
      } catch (updateError) {
        logger.error(`❌ Erro ao atualizar status para error: ${updateError}`);
      }
    }
  }
}

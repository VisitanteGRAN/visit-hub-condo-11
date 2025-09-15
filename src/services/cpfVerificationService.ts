import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/utils/secureLogger';

export interface VisitanteExistente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  status: string;
  validade_fim: string;
  morador_id: string;
  morador_nome?: string;
  ultimo_acesso?: string;
}

export interface CPFVerificationResult {
  exists: boolean;
  visitante?: VisitanteExistente;
  needsReactivation: boolean;
  canReactivate: boolean;
  message: string;
}

export class CPFVerificationService {
  /**
   * Verificar se CPF já existe no sistema
   */
  async verificarCPF(cpf: string): Promise<CPFVerificationResult> {
    try {
      // [REMOVED] Sensitive data log removed for security;
      
      // Limpar CPF (apenas números)
      const cpfLimpo = cpf.replace(/\D/g, '');
      
      if (cpfLimpo.length !== 11) {
        return {
          exists: false,
          needsReactivation: false,
          canReactivate: false,
          message: 'CPF inválido'
        };
      }

      // Buscar visitante no banco
      const { data: visitante, error } = await supabase
        .from('visitantes')
        .select(`
          *,
          morador:usuarios(nome)
        `)
        .eq('cpf', cpfLimpo)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar CPF:', error);
        throw new Error(`Erro ao verificar CPF: ${error.message}`);
      }

      if (!visitante) {
        // [REMOVED] Sensitive data log removed for security;
        return {
          exists: false,
          needsReactivation: false,
          canReactivate: false,
          message: 'CPF não cadastrado - visitante novo'
        };
      }

      console.log('📋 Visitante encontrado:', visitante);

      // Verificar se está ativo
      const agora = new Date();
      const validadeFim = new Date(visitante.validade_fim);
      const isVencido = validadeFim < agora;
      const isInativo = visitante.status !== 'ativo';

      const needsReactivation = isVencido || isInativo;

      const visitanteData: VisitanteExistente = {
        id: visitante.id,
        nome: visitante.nome,
        cpf: visitante.cpf,
        telefone: visitante.telefone || '',
        status: visitante.status,
        validade_fim: visitante.validade_fim,
        morador_id: visitante.morador_id,
        morador_nome: visitante.morador?.nome || '',
        ultimo_acesso: visitante.updated_at
      };

      if (!needsReactivation) {
        return {
          exists: true,
          visitante: visitanteData,
          needsReactivation: false,
          canReactivate: false,
          message: `Visitante ${visitante.nome} já está ativo até ${validadeFim.toLocaleDateString()}`
        };
      }

      return {
        exists: true,
        visitante: visitanteData,
        needsReactivation: true,
        canReactivate: true,
        message: `Visitante ${visitante.nome} encontrado - precisa reativar`
      };

    } catch (error) {
      console.error('❌ Erro na verificação de CPF:', error);
      return {
        exists: false,
        needsReactivation: false,
        canReactivate: false,
        message: `Erro ao verificar CPF: ${error}`
      };
    }
  }

  /**
   * Reativar visitante vinculando ao novo morador
   */
  async reativarVisitante(
    visitanteId: string, 
    novoMoradorId: string, 
    validadeDias: number = 1
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🔄 Reativando visitante:', visitanteId, 'para morador:', novoMoradorId);

      // Calcular nova validade
      const validadeInicio = new Date();
      const validadeFim = new Date();
      validadeFim.setDate(validadeFim.getDate() + validadeDias);
      validadeFim.setHours(23, 59, 59, 999);

      console.log('🔍 Dados para atualização:', {
        visitanteId,
        novoMoradorId,
        validadeInicio: validadeInicio.toISOString(),
        validadeFim: validadeFim.toISOString()
      });

      // Verificar se o visitante existe antes de tentar atualizar
      const { data: visitanteExiste, error: checkError } = await supabase
        .from('visitantes')
        .select('id, nome, status, morador_id')
        .eq('id', visitanteId);

      console.log('🔍 Verificação de existência:', { visitanteExiste, checkError });
      
      if (visitanteExiste && visitanteExiste.length > 0) {
        console.log('✅ Visitante encontrado para update:', visitanteExiste[0]);
      }

      if (checkError) {
        throw new Error(`Erro ao verificar visitante: ${checkError.message}`);
      }

      if (!visitanteExiste || visitanteExiste.length === 0) {
        throw new Error(`Visitante com ID ${visitanteId} não encontrado para atualização`);
      }

      // Primeiro tentar UPDATE simples sem SELECT
      const { error: simpleUpdateError } = await supabaseAdmin
        .from('visitantes')
        .update({
          morador_id: novoMoradorId,
          status: 'ativo',
          validade_inicio: validadeInicio.toISOString(),
          validade_fim: validadeFim.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', visitanteId);

      console.log('🔧 Resultado UPDATE simples:', { error: simpleUpdateError });

      if (simpleUpdateError) {
        throw new Error(`Erro no UPDATE simples: ${simpleUpdateError.message}`);
      }

      // Agora buscar o registro atualizado
      const { data: visitantesAtualizados, error: selectError } = await supabaseAdmin
        .from('visitantes')
        .select('*')
        .eq('id', visitanteId);

      console.log('🔧 Resultado do SELECT após UPDATE:', { 
        data: visitantesAtualizados, 
        error: selectError,
        length: visitantesAtualizados?.length || 0
      });

      if (selectError) {
        throw new Error(`Erro ao buscar visitante atualizado: ${selectError.message}`);
      }

      if (!visitantesAtualizados || visitantesAtualizados.length === 0) {
        logger.error('❌ UPDATE não retornou dados. Possível problema de RLS ou permissão.');
        throw new Error('Nenhum visitante foi atualizado - verifique permissões RLS');
      }

      // Pegar o primeiro (e deveria ser único) resultado
      const visitanteAtualizado = visitantesAtualizados[0];

      console.log('✅ Visitante atualizado no banco:', visitanteAtualizado);
      logger.info(`📊 Total de registros atualizados: ${visitantesAtualizados.length}`);

      // Buscar nome do morador separadamente - USANDO ADMIN
      const { data: moradorData } = await supabaseAdmin
        .from('usuarios')
        .select('nome')
        .eq('id', novoMoradorId)
        .single();

      const nomeDoMorador = moradorData?.nome || 'Morador';

      return {
        success: true,
        message: `Visitante reativado com sucesso até ${validadeFim.toLocaleDateString()}`,
        data: {
          visitante: visitanteAtualizado,
          validadeAte: validadeFim.toISOString(),
          morador: nomeDoMorador
        }
      };

    } catch (error) {
      console.error('❌ Erro ao reativar visitante:', error);
      return {
        success: false,
        message: `Erro ao reativar visitante: ${error}`
      };
    }
  }
}

export const cpfVerificationService = new CPFVerificationService();

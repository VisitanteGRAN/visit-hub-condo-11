import { supabase } from '@/integrations/supabase/client';

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
      console.log('🔍 Verificando CPF no sistema:', cpf);
      
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
        console.log('✅ CPF não encontrado - visitante novo');
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

      // Atualizar visitante no banco
      const { data: visitanteAtualizado, error: updateError } = await supabase
        .from('visitantes')
        .update({
          morador_id: novoMoradorId,
          status: 'ativo',
          validade_inicio: validadeInicio.toISOString(),
          validade_fim: validadeFim.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', visitanteId)
        .select(`
          *,
          morador:usuarios(nome)
        `)
        .single();

      if (updateError) {
        throw new Error(`Erro ao atualizar visitante: ${updateError.message}`);
      }

      console.log('✅ Visitante atualizado no banco:', visitanteAtualizado);

      return {
        success: true,
        message: `Visitante reativado com sucesso até ${validadeFim.toLocaleDateString()}`,
        data: {
          visitante: visitanteAtualizado,
          validadeAte: validadeFim.toISOString(),
          morador: visitanteAtualizado.morador?.nome
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

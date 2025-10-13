import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/secureLogger';

// CLIENTE DIRETO COM SERVICE KEY HARDCODED PARA GARANTIR FUNCIONAMENTO
const supabaseUrl = "https://rnpgtwughapxxvvckepd.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAzMzUzOSwiZXhwIjoyMDcwNjA5NTM5fQ.2t6m1iUk_TRXtbEACh-P6dKJWRqyeLBe1OrUZemFd90";

// Cliente admin direto
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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
      console.log('🔍 Iniciando verificação de CPF...');
      
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

      console.log('🔍 CPF limpo:', cpfLimpo);

      // MÉTODO 1: Tentar com supabaseAdmin
      try {
        const { data: visitante, error } = await supabaseAdmin
          .from('visitantes')
          .select(`
            *,
            morador:usuarios(nome)
          `)
          .eq('cpf', cpfLimpo)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error || error.code === 'PGRST116') {
          return this.processVisitanteResult(visitante, error);
        }
        
        console.warn('⚠️ Supabase client falhou, tentando fetch direto...');
        throw error;
        
      } catch (supabaseError) {
        console.warn('⚠️ Erro no supabaseAdmin, usando fetch direto:', supabaseError);
        
        // MÉTODO 2: Fetch direto como backup
        const response = await fetch(`${supabaseUrl}/rest/v1/visitantes?select=*,morador:usuarios(nome)&cpf=eq.${cpfLimpo}&order=created_at.desc&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': serviceKey,
            'authorization': `Bearer ${serviceKey}`,
            'content-type': 'application/json',
            'accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const visitante = data && data.length > 0 ? data[0] : null;
        
        return this.processVisitanteResult(visitante, null);
      }

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

  private processVisitanteResult(visitante: any, error: any): CPFVerificationResult {
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar CPF:', error);
      throw new Error(`Erro ao verificar CPF: ${error.message}`);
    }

    if (!visitante) {
      console.log('📋 CPF não encontrado - visitante novo');
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

      // MÉTODO 1: Tentar com supabaseAdmin local
      try {
        // Verificar se o visitante existe
        const { data: visitanteExiste, error: checkError } = await supabaseAdmin
          .from('visitantes')
          .select('id, nome, status, morador_id')
          .eq('id', visitanteId);

        if (checkError) {
          console.warn('⚠️ Erro na verificação, tentando fetch direto:', checkError);
          throw checkError;
        }

        if (!visitanteExiste || visitanteExiste.length === 0) {
          throw new Error(`Visitante com ID ${visitanteId} não encontrado`);
        }

        // Atualizar visitante
        const { error: updateError } = await supabaseAdmin
          .from('visitantes')
          .update({
            morador_id: novoMoradorId,
            status: 'ativo',
            validade_inicio: validadeInicio.toISOString(),
            validade_fim: validadeFim.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', visitanteId);

        if (updateError) {
          console.warn('⚠️ Erro no update, tentando fetch direto:', updateError);
          throw updateError;
        }

        // Buscar visitante atualizado
        const { data: visitanteAtualizado, error: selectError } = await supabaseAdmin
          .from('visitantes')
          .select('*')
          .eq('id', visitanteId)
          .single();

        if (selectError) {
          console.warn('⚠️ Erro no select, mas update foi bem-sucedido');
        }

        // Buscar nome do morador
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
            visitante: visitanteAtualizado || { id: visitanteId },
            validadeAte: validadeFim.toISOString(),
            morador: nomeDoMorador
          }
        };

      } catch (supabaseError) {
        console.warn('⚠️ Erro no supabaseAdmin, usando fetch direto:', supabaseError);
        
        // MÉTODO 2: Fetch direto como backup
        const updateData = {
          morador_id: novoMoradorId,
          status: 'ativo',
          validade_inicio: validadeInicio.toISOString(),
          validade_fim: validadeFim.toISOString(),
          updated_at: new Date().toISOString()
        };

        const response = await fetch(`${supabaseUrl}/rest/v1/visitantes?id=eq.${visitanteId}`, {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'authorization': `Bearer ${serviceKey}`,
            'content-type': 'application/json',
            'accept': 'application/json',
            'prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const updatedData = await response.json();
        console.log('✅ Visitante atualizado via fetch:', updatedData);

        return {
          success: true,
          message: `Visitante reativado com sucesso até ${validadeFim.toLocaleDateString()}`,
          data: {
            visitante: updatedData[0] || { id: visitanteId },
            validadeAte: validadeFim.toISOString(),
            morador: 'Morador'
          }
        };
      }

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

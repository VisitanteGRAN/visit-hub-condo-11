import { supabase } from '@/integrations/supabase/client';
import { normalizeName } from '@/utils/normalizeText';
import { logger } from '@/utils/secureLogger';

export interface MoradorData {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  unidade: string;
  ativo: boolean;
}

export class MoradorService {
  
  /**
   * Busca morador pelo CPF para vincular com visitante
   */
  async buscarMoradorPorCPF(cpf: string): Promise<MoradorData | null> {
    try {
      // [REMOVED] Sensitive data log removed for security;
      
      // Limpar CPF (remover formatação)
      const cpfLimpo = cpf.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf, telefone, unidade, ativo')
        .eq('cpf', cpfLimpo)
        .eq('perfil', 'morador')
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // [REMOVED] Sensitive data log removed for security;
          return null;
        }
        throw error;
      }

      console.log('✅ Morador encontrado:', data.nome);
      return data;
      
    } catch (error) {
      console.error('❌ Erro ao buscar morador:', error);
      return null;
    }
  }

  /**
   * Lista todos os moradores ativos (para admin)
   */
  async listarMoradores(): Promise<MoradorData[]> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf, telefone, unidade, ativo')
        .eq('perfil', 'morador')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      return data || [];
      
    } catch (error) {
      console.error('❌ Erro ao listar moradores:', error);
      return [];
    }
  }

  /**
   * Busca moradores por nome ou unidade
   * Agora usa nome_normalized para compatibilidade com HikCentral
   */
  async buscarMoradores(termo: string): Promise<MoradorData[]> {
    try {
      // Normalizar termo de busca para melhor compatibilidade
      const termoNormalizado = normalizeName(termo);
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf, telefone, unidade, ativo, nome_normalized')
        .eq('perfil', 'morador')
        .eq('ativo', true)
        .or(`nome.ilike.%${termo}%, nome_normalized.ilike.%${termoNormalizado}%, unidade.ilike.%${termo}%`)
        .order('nome');

      if (error) throw error;

      return data || [];
      
    } catch (error) {
      console.error('❌ Erro ao buscar moradores:', error);
      return [];
    }
  }

  /**
   * Busca morador por nome normalizado (para uso do script HikCentral)
   */
  async buscarMoradorPorNomeNormalizado(nomeNormalizado: string): Promise<MoradorData | null> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf, telefone, unidade, ativo, nome_normalized')
        .eq('perfil', 'morador')
        .eq('ativo', true)
        .eq('nome_normalized', nomeNormalizado.toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ Morador não encontrado com nome normalizado: ${nomeNormalizado}`);
          return null;
        }
        throw error;
      }

      console.log('✅ Morador encontrado por nome normalizado:', data.nome);
      return data;
      
    } catch (error) {
      console.error('❌ Erro ao buscar morador por nome normalizado:', error);
      return null;
    }
  }
}

export const moradorService = new MoradorService();
export default moradorService; 
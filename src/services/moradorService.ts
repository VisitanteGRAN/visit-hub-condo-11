import { supabase } from '@/integrations/supabase/client';
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
   */
  async buscarMoradores(termo: string): Promise<MoradorData[]> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf, telefone, unidade, ativo')
        .eq('perfil', 'morador')
        .eq('ativo', true)
        .or(`nome.ilike.%${termo}%, unidade.ilike.%${termo}%`)
        .order('nome');

      if (error) throw error;

      return data || [];
      
    } catch (error) {
      console.error('❌ Erro ao buscar moradores:', error);
      return [];
    }
  }
}

export const moradorService = new MoradorService();
export default moradorService; 
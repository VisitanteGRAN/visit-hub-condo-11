import { supabase } from '@/integrations/supabase/client';

export interface VisitorQueueData {
  nome: string;
  telefone: string;
  cpf: string;
  rg: string;
  placa: string;
  genero: string;
  morador_nome?: string; // ⭐ NOVO: Nome do morador para campo "Visitado"
  action?: string; // ⭐ NOVO: 'create' ou 'reactivate'
  validade_dias?: number; // ⭐ NOVO: Duração em dias especificada pelo morador
  photo_base64?: string;
}

export class QueueService {
  /**
   * Envia visitante para a fila de processamento
   */
  async sendToQueue(visitorData: VisitorQueueData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      console.log('📤 Enviando visitante para fila Supabase:', visitorData.nome);
      console.log('📋 Dados recebidos no queueService:', visitorData);

      // Dados para inserir
      const insertData = {
        visitor_data: {
          nome: visitorData.nome,
          telefone: visitorData.telefone,
          cpf: visitorData.cpf,
          rg: visitorData.rg,
          placa: visitorData.placa,
          genero: visitorData.genero,
          morador_nome: visitorData.morador_nome, // ⭐ INCLUIR nome do morador
          action: visitorData.action || 'create', // ⭐ INCLUIR ação (create/reactivate)
          validade_dias: visitorData.validade_dias || 1 // ⭐ INCLUIR duração em dias
        },
        photo_base64: visitorData.photo_base64 || null,
        status: 'pending',
        priority: 1
      };
      
      console.log('📦 Dados que serão inseridos no Supabase:', insertData);

      const { data, error } = await supabase
        .from('visitor_registration_queue')
        .insert(insertData as any)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Erro ao enviar para fila:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const queueId = (data as any)?.id;
      if (!queueId) {
        return {
          success: false,
          error: 'ID não retornado após inserção'
        };
      }

      console.log('✅ Visitante enviado para fila com ID:', queueId);
      
      return {
        success: true,
        id: queueId
      };

    } catch (error) {
      console.error('❌ Erro ao enviar para fila:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verifica o status de um item na fila
   */
  async checkQueueStatus(queueId: string): Promise<{ status: string; error_message?: string }> {
    try {
      const { data, error } = await supabase
        .from('visitor_registration_queue')
        .select('status, error_message')
        .eq('id', queueId)
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Dados não encontrados');
      }

      return {
        status: (data as any).status,
        error_message: (data as any).error_message
      };

    } catch (error) {
      console.error('❌ Erro ao verificar status da fila:', error);
      return {
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export const queueService = new QueueService(); 
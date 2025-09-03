import { supabase } from '@/integrations/supabase/client';

export interface VisitorQueueData {
  name: string;
  phone: string;
  rg: string;
  placa: string;
  genero: string;
  photo_base64?: string;
}

export class QueueService {
  /**
   * Envia visitante para a fila de processamento
   */
  async sendToQueue(visitorData: VisitorQueueData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      console.log('📤 Enviando visitante para fila Supabase:', visitorData.name);

      // Dados para inserir
      const insertData = {
        visitor_data: {
          name: visitorData.name,
          phone: visitorData.phone,
          rg: visitorData.rg,
          placa: visitorData.placa,
          genero: visitorData.genero
        },
        photo_base64: visitorData.photo_base64 || null,
        status: 'pending',
        priority: 1
      };

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
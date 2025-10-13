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

      // 🛡️ DUPLA PROTEÇÃO: Tentar supabaseAdmin primeiro, depois fetch direto
      try {
        const { data, error } = await supabaseAdmin
          .from('visitor_registration_queue')
          .insert(insertData as any)
          .select('id')
          .single();

        if (error) {
          console.warn('⚠️ Erro no supabaseAdmin, tentando fetch direto:', error.message);
          throw new Error('Fallback para fetch direto');
        }

        const queueId = (data as any)?.id;
        if (!queueId) {
          console.warn('⚠️ ID não retornado, tentando fetch direto');
          throw new Error('Fallback para fetch direto');
        }

        console.log('✅ Visitante enviado para fila com ID (supabaseAdmin):', queueId);
        
        return {
          success: true,
          id: queueId
        };

      } catch (adminError) {
        console.log('🔄 Tentando fetch direto como fallback...');
        
        // 🚨 FALLBACK: Usar fetch direto com service key hardcoded
        const response = await fetch(`${supabaseUrl}/rest/v1/visitor_registration_queue`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'authorization': `Bearer ${serviceKey}`,
            'content-type': 'application/json',
            'accept': 'application/json',
            'prefer': 'return=representation'
          },
          body: JSON.stringify(insertData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erro no fetch direto:', response.status, errorText);
          return {
            success: false,
            error: `HTTP ${response.status}: ${errorText}`
          };
        }

        const data = await response.json();
        const queueId = Array.isArray(data) ? data[0]?.id : data?.id;
        
        if (!queueId) {
          return {
            success: false,
            error: 'ID não retornado após inserção (fetch direto)'
          };
        }

        console.log('✅ Visitante enviado para fila com ID (fetch direto):', queueId);
        
        return {
          success: true,
          id: queueId
        };
      }

    } catch (error) {
      console.error('❌ Erro geral ao enviar para fila:', error);
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
      // 🛡️ DUPLA PROTEÇÃO: Tentar supabaseAdmin primeiro, depois fetch direto
      try {
        const { data, error } = await supabaseAdmin
          .from('visitor_registration_queue')
          .select('status, error_message')
          .eq('id', queueId)
          .single();

        if (error || !data) {
          console.warn('⚠️ Erro no supabaseAdmin, tentando fetch direto:', error?.message);
          throw new Error('Fallback para fetch direto');
        }

        return {
          status: (data as any).status,
          error_message: (data as any).error_message
        };

      } catch (adminError) {
        console.log('🔄 Tentando fetch direto como fallback...');
        
        // 🚨 FALLBACK: Usar fetch direto com service key hardcoded
        const response = await fetch(`${supabaseUrl}/rest/v1/visitor_registration_queue?select=status,error_message&id=eq.${queueId}`, {
          headers: {
            'apikey': serviceKey,
            'authorization': `Bearer ${serviceKey}`,
            'content-type': 'application/json',
            'accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erro no fetch direto:', response.status, errorText);
          return {
            status: 'error',
            error_message: `HTTP ${response.status}: ${errorText}`
          };
        }

        const data = await response.json();
        const item = Array.isArray(data) ? data[0] : data;
        
        if (!item) {
          return {
            status: 'error',
            error_message: 'Item não encontrado na fila'
          };
        }

        return {
          status: item.status,
          error_message: item.error_message
        };
      }

    } catch (error) {
      console.error('❌ Erro geral ao verificar status da fila:', error);
      return {
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export const queueService = new QueueService(); 
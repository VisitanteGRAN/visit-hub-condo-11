// import { supabaseAdmin } from './supabase-admin';
import { logger } from '@/utils/secureLogger';

interface AuditLogData {
  user_id?: string;
  user_email?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

export class AuditLogger {
  static async log(data: AuditLogData) {
    try {
      // Log no console para desenvolvimento
      console.log('🔍 AUDIT LOG:', {
        timestamp: new Date().toISOString(),
        ...data
      });

      // TODO: Implementar tabela de auditoria no Supabase
      // const { error } = await supabaseAdmin
      //   .from('audit_logs')
      //   .insert({
      //     user_id: data.user_id,
      //     user_email: data.user_email,
      //     action: data.action,
      //     resource: data.resource,
      //     resource_id: data.resource_id,
      //     details: data.details,
      //     ip_address: data.ip_address,
      //     user_agent: data.user_agent,
      //     created_at: new Date().toISOString()
      //   });

      // if (error) {
      //   console.error('❌ Erro ao salvar log de auditoria:', error);
      // }
    } catch (error) {
      console.error('❌ Erro no sistema de auditoria:', error);
    }
  }

  // Métodos específicos para ações comuns
  static async logLogin(user_email: string, success: boolean) {
    await this.log({
      user_email,
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      resource: 'auth',
      details: { success }
    });
  }

  static async logUserApproval(admin_email: string, target_user_id: string, target_email: string) {
    await this.log({
      user_email: admin_email,
      action: 'USER_APPROVED',
      resource: 'usuarios',
      resource_id: target_user_id,
      details: { target_email }
    });
  }

  static async logUserRejection(admin_email: string, target_user_id: string, target_email: string) {
    await this.log({
      user_email: admin_email,
      action: 'USER_REJECTED',
      resource: 'usuarios',
      resource_id: target_user_id,
      details: { target_email }
    });
  }

  static async logVisitorCreation(user_email: string, visitor_data: any) {
    await this.log({
      user_email,
      action: 'VISITOR_CREATED',
      resource: 'visitantes',
      details: { 
        visitor_name: visitor_data.nome,
        visitor_cpf: visitor_data.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, 'XXX.XXX.XXX-$4') // Mascarar CPF
      }
    });
  }
}

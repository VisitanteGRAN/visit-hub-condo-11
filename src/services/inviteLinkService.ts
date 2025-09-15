// Serviço temporário - será integrado com o banco quando as tabelas forem criadas
import { CPFValidationService } from './cpfValidationService';
import { logger } from '@/utils/secureLogger';

export interface InviteLink {
  id: string;
  moradorId: string;
  visitanteNome: string;
  link: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
  usedAt?: string;
  visitanteId?: string;
}

export interface CreateInviteData {
  moradorId: string;
  visitanteNome: string;
  validadeDias?: number;
}

export class InviteLinkService {
  private static invites: InviteLink[] = [];

  /**
   * Gera um link único para convite
   */
  static generateUniqueLink(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const hash = btoa(timestamp + random).replace(/[^a-zA-Z0-9]/g, '');
    
    // Formato: visit-{hash}-{timestamp}
    return `visit-${hash}-${timestamp}`;
  }

  /**
   * Cria um novo link de convite
   */
  static async createInvite(data: CreateInviteData): Promise<InviteLink | null> {
    try {
      const link = this.generateUniqueLink();
      const validadeDias = data.validadeDias || 1;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validadeDias);

      const invite: InviteLink = {
        id: Date.now().toString(),
        moradorId: data.moradorId,
        visitanteNome: data.visitanteNome,
        link: link,
        expiresAt: expiresAt.toISOString(),
        isUsed: false,
        createdAt: new Date().toISOString()
      };

      this.invites.push(invite);
      return invite;
    } catch (error) {
      console.error('Erro ao criar convite:', error);
      return null;
    }
  }

  /**
   * Valida um link de convite
   */
  static async validateInvite(link: string): Promise<InviteLink | null> {
    try {
      const invite = this.invites.find(inv => 
        inv.link === link && 
        !inv.isUsed && 
        new Date(inv.expiresAt) > new Date()
      );

      return invite || null;
    } catch (error) {
      console.error('Erro ao validar convite:', error);
      return null;
    }
  }

  /**
   * Marca um convite como usado
   */
  static async markInviteAsUsed(linkId: string, visitanteId: string): Promise<boolean> {
    try {
      const invite = this.invites.find(inv => inv.id === linkId);
      if (invite) {
        invite.isUsed = true;
        invite.usedAt = new Date().toISOString();
        invite.visitanteId = visitanteId;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao marcar convite como usado:', error);
      return false;
    }
  }

  /**
   * Lista convites de um morador
   */
  static async getMoradorInvites(moradorId: string): Promise<InviteLink[]> {
    try {
      return this.invites
        .filter(inv => inv.moradorId === moradorId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Erro ao listar convites:', error);
      return [];
    }
  }

  /**
   * Gera URL completa do convite
   */
  static generateInviteURL(link: string): string {
    const baseURL = window.location.origin;
    return `${baseURL}/convite/${link}`;
  }

  /**
   * Verifica se o nome do visitante corresponde ao convite
   */
  static validateVisitanteName(invite: InviteLink, providedName: string): boolean {
    const normalizeName = (name: string) => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z\s]/g, '')
        .trim();
    };

    const normalizedInviteName = normalizeName(invite.visitanteNome);
    const normalizedProvidedName = normalizeName(providedName);

    // Verifica se o nome fornecido corresponde ao nome do convite
    return normalizedProvidedName.includes(normalizedInviteName) || 
           normalizedInviteName.includes(normalizedProvidedName);
  }

  /**
   * Deleta um convite não usado
   */
  static async deleteInvite(inviteId: string): Promise<boolean> {
    try {
      const index = this.invites.findIndex(inv => inv.id === inviteId && !inv.isUsed);
      if (index !== -1) {
        this.invites.splice(index, 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao deletar convite:', error);
      return false;
    }
  }
} 
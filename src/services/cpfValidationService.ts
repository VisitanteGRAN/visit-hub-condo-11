import { logger } from '@/utils/secureLogger';

export interface CPFData {
  cpf: string;
  nome: string;
  dataNascimento?: string;
  situacao?: string;
}

export class CPFValidationService {
  /**
   * Valida formato do CPF
   */
  static validateCPFFormat(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se não é uma sequência de números iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  }

  /**
   * Formata CPF para exibição
   */
  static formatCPF(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Consulta CPF na API da Receita (simulação)
   * Em produção, usar API oficial ou serviço de terceiros
   */
  static async consultCPF(cpf: string): Promise<CPFData | null> {
    try {
      // Simulação de consulta - em produção, integrar com API real
      const cleanCPF = cpf.replace(/\D/g, '');
      
      // Simula delay de consulta
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simula dados retornados (em produção, viria da API)
      const mockData: CPFData = {
        cpf: cleanCPF,
        nome: "NOME SIMULADO", // Em produção, viria da API
        dataNascimento: "1990-01-01",
        situacao: "REGULAR"
      };
      
      return mockData;
    } catch (error) {
      console.error('Erro na consulta do CPF:', error);
      return null;
    }
  }

  /**
   * Valida se o nome fornecido corresponde ao CPF
   */
  static validateNameMatch(cpfName: string, providedName: string): boolean {
    const normalizeName = (name: string) => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z\s]/g, '') // Remove caracteres especiais
        .trim();
    };

    const normalizedCPFName = normalizeName(cpfName);
    const normalizedProvidedName = normalizeName(providedName);

    // Verifica se o nome fornecido está contido no nome do CPF
    return normalizedProvidedName.split(' ').every(word => 
      normalizedCPFName.includes(word)
    );
  }

  /**
   * Gera hash único para o CPF (para segurança)
   */
  static generateCPFHash(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, '');
    // Em produção, usar algoritmo de hash mais seguro
    return btoa(cleanCPF + Date.now().toString()).replace(/[^a-zA-Z0-9]/g, '');
  }
} 
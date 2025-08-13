import { z } from 'zod';

// Validação de CPF
export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  // Calcula o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo[i]) * (10 - i);
  }
  let resto = soma % 11;
  let digitoVerificador1 = resto < 2 ? 0 : 11 - resto;
  
  // Verifica o primeiro dígito
  if (parseInt(cpfLimpo[9]) !== digitoVerificador1) return false;
  
  // Calcula o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo[i]) * (11 - i);
  }
  resto = soma % 11;
  let digitoVerificador2 = resto < 2 ? 0 : 11 - resto;
  
  // Verifica o segundo dígito
  return parseInt(cpfLimpo[10]) === digitoVerificador2;
}

// Formata CPF para exibição
export function formatarCPF(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, '');
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Schemas de validação com Zod
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

export const criarUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  perfil: z.enum(['morador', 'admin']),
  unidade: z.string().optional()
});

export const criarVisitanteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().refine(validarCPF, 'CPF inválido'),
  consentimento_lgpd: z.boolean().refine(val => val === true, 'Consentimento LGPD é obrigatório')
});

export const atualizarVisitanteSchema = z.object({
  nome: z.string().min(2).optional(),
  status: z.enum(['aguardando', 'liberado', 'expirado', 'cancelado', 'ativo']).optional(),
  observacoes: z.string().optional()
});

export const criarLinkConviteSchema = z.object({
  nome_visitante: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  validade_dias: z.number().min(1).max(7, 'Validade máxima é de 7 dias')
});

export const uploadArquivoSchema = z.object({
  tipo: z.enum(['selfie', 'documento'])
});

// Validação de arquivos de imagem
export function validarArquivoImagem(file: Express.Multer.File): { valid: boolean; message?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      message: 'Tipo de arquivo não permitido. Use apenas JPEG, JPG ou PNG.'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      message: 'Arquivo muito grande. Tamanho máximo é 10MB.'
    };
  }
  
  return { valid: true };
}

// Sanitização de strings
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

// Validação de token de convite
export function validarTokenConvite(token: string): boolean {
  // Token deve ter 32 caracteres hexadecimais
  return /^[a-f0-9]{32}$/.test(token);
}

// Validação de data
export function validarDataValidade(dataInicio: Date, dataFim: Date): { valid: boolean; message?: string } {
  const agora = new Date();
  
  if (dataInicio < agora) {
    return {
      valid: false,
      message: 'Data de início não pode ser no passado'
    };
  }
  
  if (dataFim <= dataInicio) {
    return {
      valid: false,
      message: 'Data de fim deve ser posterior à data de início'
    };
  }
  
  const diasDiferenca = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
  if (diasDiferenca > 7) {
    return {
      valid: false,
      message: 'Período máximo de validade é 7 dias'
    };
  }
  
  return { valid: true };
}

// Validação de senha forte
export function validarSenhaForte(senha: string): { valid: boolean; message?: string } {
  if (senha.length < 8) {
    return {
      valid: false,
      message: 'Senha deve ter pelo menos 8 caracteres'
    };
  }
  
  if (!/[A-Z]/.test(senha)) {
    return {
      valid: false,
      message: 'Senha deve conter pelo menos uma letra maiúscula'
    };
  }
  
  if (!/[a-z]/.test(senha)) {
    return {
      valid: false,
      message: 'Senha deve conter pelo menos uma letra minúscula'
    };
  }
  
  if (!/\d/.test(senha)) {
    return {
      valid: false,
      message: 'Senha deve conter pelo menos um número'
    };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
    return {
      valid: false,
      message: 'Senha deve conter pelo menos um caractere especial'
    };
  }
  
  return { valid: true };
}


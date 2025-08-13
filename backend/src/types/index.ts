// Tipos principais do sistema de gestão de visitantes

export interface Usuario {
  id: string;
  email: string;
  senha_hash: string;
  nome: string;
  perfil: 'morador' | 'admin';
  unidade?: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Visitante {
  id: string;
  nome: string;
  cpf: string;
  selfie_url?: string;
  documento_url?: string;
  status: 'aguardando' | 'liberado' | 'expirado' | 'cancelado' | 'ativo';
  unidade: string;
  morador_id: string;
  validade_inicio: Date;
  validade_fim: Date;
  hikvision_user_id?: string;
  consentimento_lgpd: boolean;
  consentimento_data: Date;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LogAcesso {
  id: string;
  visitante_id: string;
  morador_id: string;
  tipo: 'entrada' | 'saida';
  data_hora: Date;
  local: string;
  sucesso: boolean;
  observacoes?: string;
  created_at: Date;
}

export interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  descricao?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LinkConvite {
  id: string;
  token: string;
  morador_id: string;
  nome_visitante: string;
  expirado: boolean;
  usado: boolean;
  validade_dias: number;
  created_at: Date;
  expires_at: Date;
}

// Tipos para integração Hikvision
export interface HikvisionConfig {
  baseUrl: string;
  username: string;
  password: string;
  deviceIndex: string;
}

export interface HikvisionUser {
  employeeNo: string;
  name: string;
  userType: string;
  Valid: {
    enable: boolean;
    beginTime: string;
    endTime: string;
    timeType: string;
  };
  doorRight: string;
  RightPlan: Array<{
    doorNo: number;
    planTemplateNo: string;
  }>;
}

export interface HikvisionFaceData {
  employeeNo: string;
  faceLibType: string;
  FDID: string;
  faceURL: string;
}

// Tipos de requisições da API
export interface CriarVisitanteRequest {
  nome: string;
  cpf: string;
  consentimento_lgpd: boolean;
}

export interface UploadArquivoRequest {
  tipo: 'selfie' | 'documento';
  arquivo: Express.Multer.File;
}

export interface CriarLinkConviteRequest {
  nome_visitante: string;
  validade_dias: number;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: Omit<Usuario, 'senha_hash'>;
}

// Tipos de resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para notificações
export interface NotificacaoPush {
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: 'entrada_visitante' | 'cadastro_concluido' | 'acesso_expirado';
  dados_extras?: Record<string, any>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  perfil: 'morador' | 'admin';
  iat: number;
  exp: number;
}

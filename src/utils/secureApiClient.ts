// 🔐 CLIENTE API SEGURO COM TOKEN NO HEADER
// Implementa autenticação por token + retry + logs seguros

import { logger } from './secureLogger';

interface ApiClientConfig {
  baseUrl: string;
  token: string;
  timeout?: number;
  retries?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  headers: Headers;
  duration: number;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  skipAuth?: boolean;
}

class SecureApiClient {
  private config: Required<ApiClientConfig>;
  private requestId = 0;

  constructor(config: ApiClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
      token: config.token,
      timeout: config.timeout || 30000, // 30s default
      retries: config.retries || 3
    };

    logger.info('🔐 API Client inicializado', {
      baseUrl: this.config.baseUrl,
      hasToken: !!this.config.token,
      timeout: this.config.timeout
    });
  }

  /**
   * Gera ID único para cada request
   */
  private getRequestId(): string {
    this.requestId++;
    return `req_${Date.now()}_${this.requestId}`;
  }

  /**
   * Constrói headers seguros para a requisição
   */
  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'VisitHub-PWA/1.0',
      ...options.headers
    };

    // Adicionar token de autenticação
    if (!options.skipAuth && this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
      // Fallback para header X-API-Key
      headers['X-API-Key'] = this.config.token;
    }

    return headers;
  }

  /**
   * Faz requisição HTTP com retry automático
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.getRequestId();
    const startTime = Date.now();
    const url = `${this.config.baseUrl}${endpoint}`;

    logger.info(`🌐 API Request iniciada`, {
      requestId,
      method: options.method || 'GET',
      url: endpoint, // Não logar URL completa por segurança
      hasAuth: !options.skipAuth
    });

    let lastError: Error | null = null;

    // Retry loop
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.config.timeout);

        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: this.buildHeaders(options),
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
          credentials: 'omit', // Não enviar cookies para API externa
          mode: 'cors'
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        logger.api(
          options.method || 'GET',
          endpoint,
          response.status,
          duration
        );

        // Parse da resposta
        let data: T | undefined;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          try {
            data = await response.json();
          } catch (parseError) {
            logger.error('❌ Erro ao fazer parse JSON da resposta', { 
              requestId,
              parseError: parseError instanceof Error ? parseError.message : 'Unknown'
            });
          }
        }

        const apiResponse: ApiResponse<T> = {
          success: response.ok,
          data,
          error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined,
          status: response.status,
          headers: response.headers,
          duration
        };

        // Log de sucesso
        if (response.ok) {
          logger.info(`✅ API Request concluída`, {
            requestId,
            status: response.status,
            duration,
            attempt
          });
          return apiResponse;
        }

        // Log de erro HTTP
        logger.warn(`⚠️ API Request falhou`, {
          requestId,
          status: response.status,
          attempt,
          maxAttempts: this.config.retries
        });

        // Se não é erro de rede, não faz retry
        if (response.status >= 400 && response.status < 500) {
          return apiResponse;
        }

        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

      } catch (error) {
        const duration = Date.now() - startTime;
        lastError = error instanceof Error ? error : new Error('Unknown error');

        logger.error(`❌ API Request erro (tentativa ${attempt}/${this.config.retries})`, {
          requestId,
          error: lastError.message,
          duration,
          attempt
        });

        // Se é o último attempt, não esperar
        if (attempt === this.config.retries) {
          break;
        }

        // Backoff exponencial
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Falha após todos os retries
    const duration = Date.now() - startTime;
    logger.error(`💥 API Request falhou definitivamente`, {
      requestId,
      error: lastError?.message,
      duration,
      attempts: this.config.retries
    });

    return {
      success: false,
      error: lastError?.message || 'Erro desconhecido',
      status: 0,
      headers: new Headers(),
      duration
    };
  }

  /**
   * Método GET
   */
  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Método POST
   */
  async post<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * Método PUT
   */
  async put<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * Método DELETE
   */
  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Health check da API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { skipAuth: true, timeout: 5000 });
      return response.success && response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Atualiza token de autenticação
   */
  updateToken(newToken: string): void {
    this.config.token = newToken;
    logger.info('🔑 Token de API atualizado');
  }

  /**
   * Obtém configuração atual (sem dados sensíveis)
   */
  getConfig(): Omit<ApiClientConfig, 'token'> & { hasToken: boolean } {
    return {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      retries: this.config.retries,
      hasToken: !!this.config.token
    };
  }
}

// =======================================
// FACTORY E INSTÂNCIAS PRÉ-CONFIGURADAS
// =======================================

/**
 * Cria cliente API seguro
 */
export function createSecureApiClient(config: ApiClientConfig): SecureApiClient {
  return new SecureApiClient(config);
}

/**
 * Cliente para API de automação (Windows)
 */
export const automationApiClient = createSecureApiClient({
  baseUrl: import.meta.env.VITE_AUTOMATION_SERVER_URL || 'http://localhost:5001',
  token: import.meta.env.VITE_AUTOMATION_API_KEY || 'frontend_token_placeholder',
  timeout: 30000,
  retries: 3
});

/**
 * Verifica se API de automação está online
 */
export async function checkAutomationApiHealth(): Promise<boolean> {
  try {
    const isHealthy = await automationApiClient.healthCheck();
    
    if (isHealthy) {
      logger.info('✅ API de automação online');
    } else {
      logger.warn('⚠️ API de automação offline ou com problemas');
    }
    
    return isHealthy;
  } catch (error) {
    logger.error('❌ Erro ao verificar API de automação', { error });
    return false;
  }
}

/**
 * Funções específicas para operações de visitantes
 */
export const VisitorAPI = {
  /**
   * Criar visitante
   */
  async create(visitorData: any): Promise<ApiResponse> {
    return automationApiClient.post('/api/visitante', visitorData);
  },

  /**
   * Buscar visitante por ID
   */
  async getById(id: string): Promise<ApiResponse> {
    return automationApiClient.get(`/api/visitante/${id}`);
  },

  /**
   * Listar visitantes
   */
  async list(filters?: any): Promise<ApiResponse> {
    const queryParams = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return automationApiClient.get(`/api/visitantes${queryParams}`);
  },

  /**
   * Reativar visitante
   */
  async reactivate(cpf: string): Promise<ApiResponse> {
    return automationApiClient.post('/api/visitante/reactivate', { cpf });
  },

  /**
   * Verificar status do HikCentral
   */
  async checkHikCentralStatus(): Promise<ApiResponse> {
    return automationApiClient.get('/api/hikcentral/status');
  }
};

// Exports
export { SecureApiClient };
export type { ApiResponse, RequestOptions, ApiClientConfig };

// Default export
export default automationApiClient;

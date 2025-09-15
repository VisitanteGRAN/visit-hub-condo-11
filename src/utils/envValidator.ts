// 🔐 VALIDADOR DE VARIÁVEIS DE AMBIENTE SEGURAS
// Garante que configurações críticas estejam presentes e válidas

interface SecurityConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Ambiente
  nodeEnv: 'development' | 'production' | 'test';
  debugMode: boolean;
  
  // URLs
  appUrl: string;
  apiUrl?: string;
  
  // Segurança
  isSecure: boolean;
}

class EnvironmentValidator {
  private config: SecurityConfig;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor() {
    this.config = this.loadConfig();
    this.validate();
  }

  private loadConfig(): SecurityConfig {
    return {
      // Supabase (obrigatório)
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      
      // Ambiente
      nodeEnv: (import.meta.env.NODE_ENV as SecurityConfig['nodeEnv']) || 'development',
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
      
      // URLs
      appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
      apiUrl: import.meta.env.VITE_API_URL,
      
      // Segurança
      isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    };
  }

  private validate(): void {
    this.validateRequired();
    this.validateSecurity();
    this.validateUrls();
    this.validateProduction();
    
    if (this.errors.length > 0) {
      console.error('🚨 ERRO DE CONFIGURAÇÃO:', this.errors);
      throw new Error(`Configuração inválida: ${this.errors.join(', ')}`);
    }
    
    if (this.warnings.length > 0) {
      console.warn('⚠️ AVISOS DE CONFIGURAÇÃO:', this.warnings);
    }
  }

  private validateRequired(): void {
    const required = [
      { key: 'VITE_SUPABASE_URL', value: this.config.supabaseUrl },
      { key: 'VITE_SUPABASE_ANON_KEY', value: this.config.supabaseAnonKey }
    ];

    required.forEach(({ key, value }) => {
      if (!value) {
        this.errors.push(`${key} é obrigatório`);
      }
    });
  }

  private validateSecurity(): void {
    // Verificar HTTPS em produção
    if (this.config.nodeEnv === 'production' && !this.config.isSecure) {
      this.errors.push('HTTPS é obrigatório em produção');
    }

    // Verificar URLs do Supabase
    if (this.config.supabaseUrl && !this.config.supabaseUrl.startsWith('https://')) {
      this.warnings.push('Supabase URL deveria usar HTTPS');
    }

    // Verificar chaves de desenvolvimento em produção
    if (this.config.nodeEnv === 'production') {
      if (this.config.supabaseUrl.includes('localhost')) {
        this.errors.push('URL localhost não pode ser usada em produção');
      }
    }
  }

  private validateUrls(): void {
    try {
      new URL(this.config.supabaseUrl);
    } catch {
      this.errors.push('VITE_SUPABASE_URL deve ser uma URL válida');
    }

    try {
      new URL(this.config.appUrl);
    } catch {
      this.warnings.push('VITE_APP_URL deve ser uma URL válida');
    }
  }

  private validateProduction(): void {
    if (this.config.nodeEnv === 'production') {
      // Debug mode não deve estar ativo em produção
      if (this.config.debugMode) {
        this.warnings.push('Debug mode ativo em produção');
      }

      // Verificar se não estamos usando chaves de desenvolvimento
      const devPatterns = [
        'localhost',
        'test',
        'dev',
        'exemplo',
        'demo'
      ];

      devPatterns.forEach(pattern => {
        if (this.config.supabaseUrl.toLowerCase().includes(pattern)) {
          this.errors.push(`URL de produção não pode conter '${pattern}'`);
        }
      });
    }
  }

  // Getters seguros para a aplicação
  public getConfig(): Readonly<SecurityConfig> {
    return Object.freeze({ ...this.config });
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isSecureContext(): boolean {
    return this.config.isSecure;
  }

  public getSupabaseUrl(): string {
    return this.config.supabaseUrl;
  }

  public getSupabaseAnonKey(): string {
    return this.config.supabaseAnonKey;
  }

  public getAppUrl(): string {
    return this.config.appUrl;
  }

  // Método para verificar se uma feature está habilitada
  public isFeatureEnabled(feature: string): boolean {
    const envVar = `VITE_ENABLE_${feature.toUpperCase()}`;
    return import.meta.env[envVar] === 'true';
  }

  // Método para obter valores com fallback seguro
  public getEnvValue(key: string, defaultValue: string = ''): string {
    const value = import.meta.env[key] || defaultValue;
    
    // Log de acesso a variáveis sensíveis em desenvolvimento
    if (this.isDevelopment() && key.toLowerCase().includes('key')) {
      console.warn(`🔑 Acesso à variável sensível: ${key}`);
    }
    
    return value;
  }

  // Método para sanitizar dados de debug
  public getSafeDebugInfo(): Record<string, any> {
    return {
      nodeEnv: this.config.nodeEnv,
      isSecure: this.config.isSecure,
      hasSupabaseUrl: !!this.config.supabaseUrl,
      hasSupabaseKey: !!this.config.supabaseAnonKey,
      appUrl: this.config.appUrl,
      debugMode: this.config.debugMode
    };
  }
}

// Instância singleton
const envValidator = new EnvironmentValidator();

// Exports
export { envValidator };
export type { SecurityConfig };

// Helpers para uso na aplicação
export const getSecureConfig = () => envValidator.getConfig();
export const isProduction = () => envValidator.isProduction();
export const isDevelopment = () => envValidator.isDevelopment();
export const isSecureContext = () => envValidator.isSecureContext();

// Export default
export default envValidator;

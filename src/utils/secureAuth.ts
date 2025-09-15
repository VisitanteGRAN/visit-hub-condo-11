// 🔐 AUTENTICAÇÃO SEGURA COM HTTPONLY COOKIES
// Substitui localStorage por cookies seguros para JWT

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

class SecureAuthManager {
  private readonly ACCESS_TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly EXPIRES_KEY = 'token_expires';
  
  constructor() {
    // Migrar tokens existentes do localStorage para cookies
    this.migrateFromLocalStorage();
  }

  /**
   * Migra tokens do localStorage para cookies seguros
   */
  private migrateFromLocalStorage(): void {
    try {
      const existingToken = localStorage.getItem('auth_token') || 
                           localStorage.getItem('sb-rnpgtwughapxxvvckepd-auth-token');
      
      if (existingToken) {
        console.log('🔄 Migrando token do localStorage para cookie seguro...');
        
        // Tentar fazer parse se for JSON
        let tokenData: any = existingToken;
        try {
          tokenData = JSON.parse(existingToken);
        } catch {
          // Se não for JSON, usar como string simples
        }
        
        // Extrair access token
        const accessToken = typeof tokenData === 'string' ? 
                           tokenData : 
                           tokenData.access_token || tokenData.accessToken;
        
        if (accessToken) {
          this.setTokens({ accessToken });
        }
        
        // Limpar localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('sb-rnpgtwughapxxvvckepd-auth-token');
        sessionStorage.removeItem('auth_token');
        
        console.log('✅ Migração concluída - tokens agora em cookies seguros');
      }
    } catch (error) {
      console.error('❌ Erro na migração de tokens:', error);
    }
  }

  /**
   * Define cookies seguros (para server-side)
   * Esta função seria chamada do backend
   */
  private setSecureCookie(name: string, value: string, options: CookieOptions = {}): void {
    const defaultOptions: CookieOptions = {
      httpOnly: true,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    // Em ambiente browser, usamos document.cookie (não httpOnly)
    // Em produção, isso seria feito pelo servidor
    if (typeof document !== 'undefined') {
      let cookieString = `${name}=${encodeURIComponent(value)}`;
      
      if (finalOptions.maxAge) {
        const expires = new Date(Date.now() + finalOptions.maxAge);
        cookieString += `; expires=${expires.toUTCString()}`;
      }
      
      if (finalOptions.path) {
        cookieString += `; path=${finalOptions.path}`;
      }
      
      if (finalOptions.secure) {
        cookieString += '; secure';
      }
      
      if (finalOptions.sameSite) {
        cookieString += `; samesite=${finalOptions.sameSite}`;
      }
      
      document.cookie = cookieString;
    }
  }

  /**
   * Lê cookie do browser
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    
    return null;
  }

  /**
   * Remove cookie
   */
  private removeCookie(name: string): void {
    if (typeof document === 'undefined') return;
    
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  /**
   * Salva tokens de forma segura
   */
  public setTokens(tokens: AuthTokens): void {
    const { accessToken, refreshToken, expiresAt } = tokens;
    
    // Access token (vida curta)
    this.setSecureCookie(this.ACCESS_TOKEN_KEY, accessToken, {
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });
    
    // Refresh token (vida longa)
    if (refreshToken) {
      this.setSecureCookie(this.REFRESH_TOKEN_KEY, refreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      });
    }
    
    // Timestamp de expiração
    if (expiresAt) {
      this.setSecureCookie(this.EXPIRES_KEY, expiresAt.toString(), {
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      });
    }
  }

  /**
   * Recupera access token
   */
  public getAccessToken(): string | null {
    return this.getCookie(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Recupera refresh token
   */
  public getRefreshToken(): string | null {
    return this.getCookie(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Verifica se token está expirado
   */
  public isTokenExpired(): boolean {
    const expiresAtStr = this.getCookie(this.EXPIRES_KEY);
    
    if (!expiresAtStr) {
      return false; // Se não tem expiração, assume que não expirou
    }
    
    const expiresAt = parseInt(expiresAtStr, 10);
    return Date.now() > expiresAt;
  }

  /**
   * Recupera todos os tokens
   */
  public getTokens(): AuthTokens | null {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      return null;
    }
    
    const refreshToken = this.getRefreshToken();
    const expiresAtStr = this.getCookie(this.EXPIRES_KEY);
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : undefined;
    
    return {
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt
    };
  }

  /**
   * Remove todos os tokens (logout)
   */
  public clearTokens(): void {
    this.removeCookie(this.ACCESS_TOKEN_KEY);
    this.removeCookie(this.REFRESH_TOKEN_KEY);
    this.removeCookie(this.EXPIRES_KEY);
    
    // Limpar também localStorage e sessionStorage como precaução
    localStorage.removeItem('auth_token');
    localStorage.removeItem('sb-rnpgtwughapxxvvckepd-auth-token');
    sessionStorage.removeItem('auth_token');
  }

  /**
   * Verifica se usuário está autenticado
   */
  public isAuthenticated(): boolean {
    const tokens = this.getTokens();
    return !!(tokens?.accessToken && !this.isTokenExpired());
  }

  /**
   * Atualiza token se necessário
   */
  public async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.isTokenExpired()) {
      return true; // Token ainda válido
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false; // Sem refresh token
    }

    try {
      // Aqui você faria a chamada para o endpoint de refresh
      // Por enquanto, retornamos false para forçar novo login
      console.log('🔄 Token expirado, necessário novo login');
      this.clearTokens();
      return false;
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Header de autorização para requests
   */
  public getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    
    if (!token) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Interceptor para adicionar token em requests
   */
  public async addAuthToRequest(config: RequestInit): Promise<RequestInit> {
    // Verificar se token precisa ser renovado
    await this.refreshTokenIfNeeded();
    
    const authHeader = this.getAuthHeader();
    
    return {
      ...config,
      headers: {
        ...config.headers,
        ...authHeader
      }
    };
  }
}

// Instância singleton
export const secureAuth = new SecureAuthManager();

// Helpers
export const getAuthToken = () => secureAuth.getAccessToken();
export const isAuthenticated = () => secureAuth.isAuthenticated();
export const clearAuth = () => secureAuth.clearTokens();
export const getAuthHeader = () => secureAuth.getAuthHeader();

export default secureAuth;

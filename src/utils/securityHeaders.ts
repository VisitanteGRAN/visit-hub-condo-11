// 🛡️ HEADERS DE SEGURANÇA PARA PROTEÇÃO CONTRA ATAQUES
// Implementa CSP, HSTS, X-Frame-Options, etc.

interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'Strict-Transport-Security'?: string;
  'X-Content-Type-Options'?: string;
  'X-Frame-Options'?: string;
  'X-XSS-Protection'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'Cross-Origin-Embedder-Policy'?: string;
  'Cross-Origin-Opener-Policy'?: string;
  'Cross-Origin-Resource-Policy'?: string;
}

class SecurityHeadersManager {
  private isProduction = import.meta.env.NODE_ENV === 'production';
  private appDomain = new URL(window.location.origin).hostname;

  /**
   * Gera Content Security Policy rigoroso
   */
  private generateCSP(): string {
    const policies = [
      "default-src 'self'",
      
      // Scripts
      this.isProduction 
        ? "script-src 'self' 'unsafe-inline'" // Em produção, mais restritivo
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* 127.0.0.1:*", // Dev mais permissivo
      
      // Estilos
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      
      // Imagens
      "img-src 'self' data: blob: https://*.supabase.co https://granroyalle-visitantes.vercel.app",
      
      // Fontes
      "font-src 'self' https://fonts.gstatic.com",
      
      // Connect (APIs)
      `connect-src 'self' https://*.supabase.co ${this.isProduction ? '' : 'ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*'}`,
      
      // Media
      "media-src 'self' blob:",
      
      // Objects
      "object-src 'none'",
      
      // Base URI
      "base-uri 'self'",
      
      // Form actions
      "form-action 'self'",
      
      // Frame ancestors (previne clickjacking)
      "frame-ancestors 'none'",
      
      // Upgrade insecure requests (apenas em produção)
      ...(this.isProduction ? ["upgrade-insecure-requests"] : [])
    ];

    return policies.join('; ');
  }

  /**
   * Gera todos os headers de segurança
   */
  public getSecurityHeaders(): SecurityHeaders {
    const headers: SecurityHeaders = {
      // Content Security Policy
      'Content-Security-Policy': this.generateCSP(),
      
      // HSTS - Force HTTPS (apenas em produção)
      ...(this.isProduction && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      }),
      
      // Previne MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Previne loading em frames (clickjacking protection)
      'X-Frame-Options': 'DENY',
      
      // XSS Protection (legacy)
      'X-XSS-Protection': '1; mode=block',
      
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions Policy (Feature Policy)
      'Permissions-Policy': [
        'camera=(self)',
        'microphone=(self)', 
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()'
      ].join(', '),
      
      // Cross-Origin Policies
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin'
    };

    return headers;
  }

  /**
   * Aplica headers de segurança a uma meta tag
   */
  public applyMetaHeaders(): void {
    const headers = this.getSecurityHeaders();
    
    Object.entries(headers).forEach(([name, value]) => {
      // Criar ou atualizar meta tag
      let meta = document.querySelector(`meta[http-equiv="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('http-equiv', name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', value);
    });
  }

  /**
   * Headers para requests HTTP
   */
  public getRequestHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
  }

  /**
   * Valida se página está sendo carregada de forma segura
   */
  public validateSecureContext(): void {
    // Verificar HTTPS em produção
    if (this.isProduction && window.location.protocol !== 'https:') {
      console.error('🚨 INSEGURO: Página deve usar HTTPS em produção');
      
      // Redirecionar para HTTPS
      window.location.href = window.location.href.replace('http:', 'https:');
      return;
    }

    // Verificar se está em iframe (possível clickjacking)
    if (window.self !== window.top) {
      console.error('🚨 POSSÍVEL CLICKJACKING: Página carregada em iframe');
      
      // Opcional: quebrar out do frame
      // window.top.location = window.self.location;
    }

    // Verificar mixed content
    if (window.location.protocol === 'https:') {
      const insecureElements = document.querySelectorAll('[src^="http:"], [href^="http:"]');
      if (insecureElements.length > 0) {
        console.warn('⚠️ MIXED CONTENT: Recursos HTTP em página HTTPS detectados');
      }
    }
  }

  /**
   * Interceptor para fetch requests com headers seguros
   */
  public secureRequestInterceptor(originalFetch: typeof fetch) {
    return async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
      const secureHeaders = this.getRequestHeaders();
      
      const secureInit: RequestInit = {
        ...init,
        headers: {
          ...secureHeaders,
          ...init.headers
        },
        // Configurações de segurança
        credentials: 'same-origin', // Apenas cookies same-origin
        referrerPolicy: 'strict-origin-when-cross-origin'
      };

      return originalFetch(input, secureInit);
    };
  }

  /**
   * Sanitiza URLs antes de usar
   */
  public sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Apenas allow HTTP(S)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Protocolo não permitido');
      }
      
      // Em produção, apenas HTTPS
      if (this.isProduction && urlObj.protocol === 'http:') {
        urlObj.protocol = 'https:';
      }
      
      return urlObj.toString();
    } catch (error) {
      console.error('🚨 URL SUSPEITA bloqueada:', url, error);
      return '#'; // URL segura padrão
    }
  }

  /**
   * Remove headers sensíveis de debug
   */
  public sanitizeDebugHeaders(headers: Record<string, any>): Record<string, any> {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-auth-token'
    ];

    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

// Instância singleton
const securityHeaders = new SecurityHeadersManager();

// Auto-aplicar headers ao carregar
if (typeof document !== 'undefined') {
  // Aguardar DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      securityHeaders.applyMetaHeaders();
      securityHeaders.validateSecureContext();
    });
  } else {
    securityHeaders.applyMetaHeaders();
    securityHeaders.validateSecureContext();
  }

  // Interceptar fetch globalmente
  if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = securityHeaders.secureRequestInterceptor(originalFetch);
  }
}

// Exports
export { securityHeaders };
export default securityHeaders;

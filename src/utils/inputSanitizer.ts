// 🧹 SANITIZAÇÃO E VALIDAÇÃO ROBUSTA DE INPUTS
// Previne XSS, SQLi e outros ataques de injeção

interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  removeEmojis?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => boolean | string;
}

class InputSanitizer {
  // Padrões perigosos para remover
  private dangerousPatterns = [
    // Scripts
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<applet[^>]*>.*?<\/applet>/gi,
    /<form[^>]*>.*?<\/form>/gi,
    
    // Event handlers
    /on\w+\s*=\s*["\'].*?["\']/gi,
    
    // Javascript URLs
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /data\s*:/gi,
    
    // Meta refresh
    /<meta[^>]*refresh[^>]*>/gi,
    
    // Link imports
    /<link[^>]*import[^>]*>/gi,
  ];

  // Caracteres perigosos para escape
  private dangerousChars: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '\\': '&#x5C;',
    '&': '&amp;'
  };

  /**
   * Sanitiza string removendo conteúdo perigoso
   */
  public sanitizeString(input: string, options: SanitizationOptions = {}): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Trim whitespace
    if (options.trimWhitespace !== false) {
      sanitized = sanitized.trim();
    }

    // Aplicar limite de caracteres
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Remover emojis se solicitado
    if (options.removeEmojis) {
      sanitized = this.removeEmojis(sanitized);
    }

    // Se HTML não é permitido, fazer escape completo
    if (!options.allowHtml) {
      sanitized = this.escapeHtml(sanitized);
    } else {
      // Se HTML é permitido, sanitizar seletivamente
      sanitized = this.sanitizeHtml(sanitized, options);
    }

    return sanitized;
  }

  /**
   * Escape HTML completo
   */
  private escapeHtml(input: string): string {
    return input.replace(/[<>"'\/\\&]/g, (char) => this.dangerousChars[char] || char);
  }

  /**
   * Sanitização seletiva de HTML
   */
  private sanitizeHtml(input: string, options: SanitizationOptions): string {
    let sanitized = input;

    // Remover padrões perigosos
    this.dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Se há tags permitidas, remover as não permitidas
    if (options.allowedTags) {
      const allowedTagsPattern = options.allowedTags.join('|');
      const tagPattern = new RegExp(`<(?!\/?(?:${allowedTagsPattern})(?:\s|>))[^>]*>`, 'gi');
      sanitized = sanitized.replace(tagPattern, '');
    }

    return sanitized;
  }

  /**
   * Remove emojis e caracteres especiais
   */
  private removeEmojis(input: string): string {
    return input.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  }

  /**
   * Sanitiza CPF
   */
  public sanitizeCPF(cpf: string): string {
    if (!cpf) return '';
    
    // Remove tudo exceto números
    const cleaned = cpf.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    return cleaned.substring(0, 11);
  }

  /**
   * Sanitiza telefone
   */
  public sanitizePhone(phone: string): string {
    if (!phone) return '';
    
    // Remove tudo exceto números, parênteses, espaços e hífens
    const cleaned = phone.replace(/[^\d\s\-\(\)]/g, '');
    
    // Limita a tamanho razoável
    return cleaned.substring(0, 20);
  }

  /**
   * Sanitiza email
   */
  public sanitizeEmail(email: string): string {
    if (!email) return '';
    
    // Remove espaços e converte para lowercase
    let sanitized = email.trim().toLowerCase();
    
    // Remove caracteres perigosos, mas mantém válidos para email
    sanitized = sanitized.replace(/[<>"'\\]/g, '');
    
    return sanitized.substring(0, 255); // Limite RFC
  }

  /**
   * Sanitiza URL
   */
  public sanitizeUrl(url: string): string {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      
      // Apenas protocolos seguros
      if (!['http:', 'https:', 'mailto:', 'tel:'].includes(urlObj.protocol)) {
        return '';
      }
      
      return urlObj.toString();
    } catch {
      return ''; // URL inválida
    }
  }

  /**
   * Sanitiza nome/texto geral
   */
  public sanitizeName(name: string): string {
    if (!name) return '';
    
    // Remove HTML e caracteres perigosos
    let sanitized = this.escapeHtml(name.trim());
    
    // Remove números e caracteres especiais excessivos
    sanitized = sanitized.replace(/[^\w\s\u00C0-\u017F\-'\.]/g, '');
    
    // Remove espaços múltiplos
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    return sanitized.substring(0, 100);
  }

  /**
   * Valida input com regras
   */
  public validateInput(value: string, rules: ValidationRule): { valid: boolean; error?: string } {
    // Required check
    if (rules.required && (!value || value.trim() === '')) {
      return { valid: false, error: 'Campo obrigatório' };
    }

    // Se vazio e não obrigatório, passa
    if (!value || value.trim() === '') {
      return { valid: true };
    }

    // Min length
    if (rules.minLength && value.length < rules.minLength) {
      return { valid: false, error: `Mínimo ${rules.minLength} caracteres` };
    }

    // Max length
    if (rules.maxLength && value.length > rules.maxLength) {
      return { valid: false, error: `Máximo ${rules.maxLength} caracteres` };
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return { valid: false, error: 'Formato inválido' };
    }

    // Custom validator
    if (rules.customValidator) {
      const result = rules.customValidator(value);
      if (result !== true) {
        return { valid: false, error: typeof result === 'string' ? result : 'Valor inválido' };
      }
    }

    return { valid: true };
  }

  /**
   * Sanitiza objeto completo
   */
  public sanitizeObject<T extends Record<string, any>>(
    obj: T, 
    rules: Record<keyof T, SanitizationOptions & ValidationRule>
  ): { sanitized: Partial<T>; errors: Record<keyof T, string> } {
    const sanitized: Partial<T> = {};
    const errors: Record<keyof T, string> = {};

    Object.entries(obj).forEach(([key, value]) => {
      const rule = rules[key as keyof T];
      
      if (!rule) {
        sanitized[key as keyof T] = value;
        return;
      }

      // Sanitizar valor
      let sanitizedValue = '';
      
      if (typeof value === 'string') {
        // Aplicar sanitização específica baseada no tipo de campo
        if (key.toLowerCase().includes('email')) {
          sanitizedValue = this.sanitizeEmail(value);
        } else if (key.toLowerCase().includes('cpf')) {
          sanitizedValue = this.sanitizeCPF(value);
        } else if (key.toLowerCase().includes('telefone') || key.toLowerCase().includes('phone')) {
          sanitizedValue = this.sanitizePhone(value);
        } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
          sanitizedValue = this.sanitizeUrl(value);
        } else if (key.toLowerCase().includes('nome') || key.toLowerCase().includes('name')) {
          sanitizedValue = this.sanitizeName(value);
        } else {
          sanitizedValue = this.sanitizeString(value, rule);
        }
      } else {
        sanitizedValue = value;
      }

      // Validar
      const validation = this.validateInput(sanitizedValue, rule);
      
      if (validation.valid) {
        sanitized[key as keyof T] = sanitizedValue as T[keyof T];
      } else {
        errors[key as keyof T] = validation.error!;
      }
    });

    return { sanitized, errors };
  }

  /**
   * Validadores pré-definidos
   */
  public validators = {
    email: (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    cpf: (cpf: string): boolean => {
      const cleaned = cpf.replace(/\D/g, '');
      if (cleaned.length !== 11) return false;
      
      // Verificar se não são todos iguais
      if (/^(\d)\1{10}$/.test(cleaned)) return false;
      
      // Validação dos dígitos verificadores
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned[i]) * (10 - i);
      }
      let digit1 = (sum * 10) % 11;
      if (digit1 === 10) digit1 = 0;
      
      if (digit1 !== parseInt(cleaned[9])) return false;
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned[i]) * (11 - i);
      }
      let digit2 = (sum * 10) % 11;
      if (digit2 === 10) digit2 = 0;
      
      return digit2 === parseInt(cleaned[10]);
    },

    phone: (phone: string): boolean => {
      const cleaned = phone.replace(/\D/g, '');
      return cleaned.length >= 10 && cleaned.length <= 11;
    },

    strongPassword: (password: string): boolean | string => {
      if (password.length < 8) return 'Senha deve ter pelo menos 8 caracteres';
      if (!/[A-Z]/.test(password)) return 'Senha deve ter pelo menos uma letra maiúscula';
      if (!/[a-z]/.test(password)) return 'Senha deve ter pelo menos uma letra minúscula';
      if (!/\d/.test(password)) return 'Senha deve ter pelo menos um número';
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Senha deve ter pelo menos um caractere especial';
      return true;
    }
  };
}

// Instância singleton
export const inputSanitizer = new InputSanitizer();

// Helpers para uso direto
export const sanitizeString = (input: string, options?: SanitizationOptions) => 
  inputSanitizer.sanitizeString(input, options);

export const sanitizeCPF = (cpf: string) => inputSanitizer.sanitizeCPF(cpf);
export const sanitizePhone = (phone: string) => inputSanitizer.sanitizePhone(phone);
export const sanitizeEmail = (email: string) => inputSanitizer.sanitizeEmail(email);
export const sanitizeName = (name: string) => inputSanitizer.sanitizeName(name);

export const validateInput = (value: string, rules: ValidationRule) => 
  inputSanitizer.validateInput(value, rules);

export const { validators } = inputSanitizer;

export default inputSanitizer;

/**
 * 🤖 AUTOMATION SERVICE
 * Serviço para integração com o servidor de automação HikCentral
 */

export interface VisitorAutomationData {
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  rg?: string;
  placa?: string;
  placa_veiculo?: string;
  photo_base64?: string; // Nova propriedade para foto
}

export interface AutomationResponse {
  success: boolean;
  message?: string;
  visitor_id?: string;
  status?: string;
  timestamp?: string;
  error?: string;
  photo_received?: boolean; // Nova propriedade
}

export interface AutomationStatus {
  success: boolean;
  visitor_id: string;
  status: {
    status: string;
    created_at?: string;
    updated_at?: string;
    retry_count?: number;
    error_message?: string;
    worker_id?: number;
    completed_at?: string;
  };
  timestamp: string;
}

export interface PhotoUploadResponse {
  success: boolean;
  message?: string;
  photo_info?: {
    filename: string;
    file_size: number;
    timestamp: number;
  };
  error?: string;
}

export interface PhotoData {
  success: boolean;
  photo_base64?: string;
  filename?: string;
  file_size?: number;
  metadata?: any;
  message?: string;
}

class AutomationService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Configuração do servidor de automação
    this.baseUrl = import.meta.env.VITE_AUTOMATION_SERVER_URL || 'http://localhost:5001';
    this.apiKey = import.meta.env.VITE_AUTOMATION_API_KEY || 'hik_automation_2024_secure_key';
  }

  /**
   * Inicia automação de cadastro no HikCentral com suporte a foto
   */
  async startAutomation(visitorId: string, visitorData: VisitorAutomationData): Promise<AutomationResponse> {
    try {
      console.log('🤖 Iniciando automação HikCentral para:', visitorId);

      const response = await fetch(`${this.baseUrl}/api/hikcentral/automation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          visitor_id: visitorId,
          visitor_data: {
            name: visitorData.name,
            phone: visitorData.phone || visitorData.cpf?.substring(0, 11) || '',
            rg: visitorData.rg || visitorData.cpf?.substring(0, 8) || '',
            placa: visitorData.placa || visitorData.placa_veiculo || '',
            // Dados adicionais
            cpf: visitorData.cpf,
            email: visitorData.email,
            // Foto em base64
            photo_base64: visitorData.photo_base64
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: AutomationResponse = await response.json();
      
      if (result.success) {
        console.log('✅ Automação iniciada com sucesso:', result);
        if (result.photo_received) {
          console.log('📸 Foto recebida e processada pelo servidor');
        }
        return result;
      } else {
        console.error('❌ Falha na automação:', result.error);
        return result;
      }

    } catch (error) {
      console.error('❌ Erro ao iniciar automação:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Faz upload de foto para um visitante específico
   */
  async uploadVisitorPhoto(visitorId: string, photoBase64: string, metadata?: any): Promise<PhotoUploadResponse> {
    try {
      console.log('📸 Fazendo upload da foto para:', visitorId);

      const response = await fetch(`${this.baseUrl}/api/hikcentral/photo/${visitorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          photo_base64: photoBase64,
          metadata: metadata || {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PhotoUploadResponse = await response.json();
      
      if (result.success) {
        console.log('✅ Foto enviada com sucesso:', result);
      } else {
        console.error('❌ Falha no upload da foto:', result.error);
      }

      return result;

    } catch (error) {
      console.error('❌ Erro ao fazer upload da foto:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Recupera foto de um visitante
   */
  async getVisitorPhoto(visitorId: string): Promise<PhotoData> {
    try {
      console.log('📷 Recuperando foto para:', visitorId);

      const response = await fetch(`${this.baseUrl}/api/hikcentral/photo/${visitorId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: 'Foto não encontrada'
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PhotoData = await response.json();
      console.log('📷 Foto recuperada com sucesso');
      return result;

    } catch (error) {
      console.error('❌ Erro ao recuperar foto:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Remove todas as fotos de um visitante
   */
  async deleteVisitorPhotos(visitorId: string): Promise<{ success: boolean; message?: string; removed_count?: number }> {
    try {
      console.log('🗑️ Removendo fotos para:', visitorId);

      const response = await fetch(`${this.baseUrl}/api/hikcentral/photos/${visitorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🗑️ Fotos removidas:', result);
      return result;

    } catch (error) {
      console.error('❌ Erro ao remover fotos:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Converte arquivo de imagem para base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Captura foto da webcam e converte para base64
   */
  async capturePhotoFromWebcam(): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      return new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          
          // Parar stream
          stream.getTracks().forEach(track => track.stop());
          
          resolve(base64);
        });
      });
    } catch (error) {
      console.error('❌ Erro ao capturar foto da webcam:', error);
      return null;
    }
  }

  /**
   * Valida formato de imagem base64
   */
  validateImageBase64(base64: string): boolean {
    try {
      if (!base64.startsWith('data:image/')) {
        return false;
      }
      
      // Verificar se o base64 é válido
      const data = base64.split(',')[1];
      atob(data);
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Redimensiona imagem base64 para tamanho máximo
   */
  async resizeImageBase64(base64: string, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular novo tamanho mantendo proporção
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Converter para base64
        const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedBase64);
      };
      
      img.src = base64;
    });
  }

  /**
   * Verifica status de uma automação
   */
  async getAutomationStatus(visitorId: string): Promise<AutomationStatus | null> {
    try {
      console.log('📊 Verificando status da automação:', visitorId);

      const response = await fetch(`${this.baseUrl}/api/hikcentral/status/${visitorId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ Automação não encontrada:', visitorId);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: AutomationStatus = await response.json();
      console.log('📊 Status da automação:', result);
      return result;

    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return null;
    }
  }

  /**
   * Monitora uma automação até completar (com timeout)
   */
  async monitorAutomation(
    visitorId: string, 
    onStatusUpdate?: (status: AutomationStatus) => void,
    maxWaitTime: number = 300000 // 5 minutos
  ): Promise<AutomationStatus | null> {
    const startTime = Date.now();
    const checkInterval = 3000; // 3 segundos

    return new Promise((resolve) => {
      const checkStatus = async () => {
        try {
          const status = await this.getAutomationStatus(visitorId);
          
          if (status) {
            // Notificar callback de atualização
            onStatusUpdate?.(status);

            // Verificar se completou
            if (status.status.status === 'completed') {
              console.log('✅ Automação completada:', visitorId);
              resolve(status);
              return;
            }

            if (status.status.status === 'failed') {
              console.log('❌ Automação falhou:', visitorId);
              resolve(status);
              return;
            }
          }

          // Verificar timeout
          if (Date.now() - startTime > maxWaitTime) {
            console.log('⏰ Timeout na automação:', visitorId);
            resolve(status);
            return;
          }

          // Continuar monitorando
          setTimeout(checkStatus, checkInterval);

        } catch (error) {
          console.error('❌ Erro no monitoramento:', error);
          resolve(null);
        }
      };

      // Iniciar monitoramento
      checkStatus();
    });
  }

  /**
   * Verifica se o servidor de automação está funcionando
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET'
      });

      if (response.ok) {
        const health = await response.json();
        console.log('✅ Servidor de automação funcionando:', health);
        return true;
      } else {
        console.warn('⚠️ Servidor de automação com problemas:', response.status);
        return false;
      }

    } catch (error) {
      console.error('❌ Servidor de automação não está respondendo:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas do servidor de automação
   */
  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/hikcentral/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return null;
    }
  }

  /**
   * Gera ID único para visitante
   */
  generateVisitorId(nome: string, cpf?: string): string {
    const timestamp = Date.now();
    const nameHash = nome.replace(/\s+/g, '').toLowerCase().substring(0, 8);
    const cpfHash = cpf ? cpf.replace(/\D/g, '').substring(0, 4) : Math.random().toString(36).substring(2, 6);
    
    return `visitor_${nameHash}_${cpfHash}_${timestamp}`;
  }
}

// Exportar instância única
export const automationService = new AutomationService();
export default automationService; 
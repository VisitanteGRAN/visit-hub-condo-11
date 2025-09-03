/**
 * 📸 EXEMPLO DE USO - SISTEMA COM FOTOS
 * ===================================
 * Exemplo prático de como integrar o sistema de automação
 * com upload de fotos no frontend React/TypeScript
 */

import { useState } from 'react';
import { toast } from 'sonner';
import automationService, { VisitorAutomationData } from '@/services/automationService';

// Exemplo de component React
export function ExemploVisitanteComFoto() {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    rg: '',
    placaVeiculo: '',
    foto: null as string | null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<string>('');

  // 1. CAPTURAR FOTO DA WEBCAM
  const handleCapturePhoto = async () => {
    try {
      const photoBase64 = await automationService.capturePhotoFromWebcam();
      
      if (photoBase64) {
        // Redimensionar foto para otimizar
        const resizedPhoto = await automationService.resizeImageBase64(
          photoBase64, 
          800, 
          600, 
          0.8
        );
        
        setFormData(prev => ({ ...prev, foto: resizedPhoto }));
        toast.success('📸 Foto capturada com sucesso!');
      } else {
        toast.error('❌ Não foi possível capturar a foto');
      }
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      toast.error('❌ Erro ao acessar câmera');
    }
  };

  // 2. FAZER UPLOAD DE ARQUIVO DE FOTO
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('❌ Por favor, selecione um arquivo de imagem');
        return;
      }

      // Converter para base64
      const photoBase64 = await automationService.fileToBase64(file);
      
      // Validar formato
      if (!automationService.validateImageBase64(photoBase64)) {
        toast.error('❌ Formato de imagem inválido');
        return;
      }

      // Redimensionar se necessário
      const resizedPhoto = await automationService.resizeImageBase64(
        photoBase64,
        800,
        600,
        0.8
      );

      setFormData(prev => ({ ...prev, foto: resizedPhoto }));
      toast.success('📸 Foto carregada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao processar foto:', error);
      toast.error('❌ Erro ao processar foto');
    }
  };

  // 3. SUBMETER FORMULÁRIO COM AUTOMAÇÃO
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.nome || !formData.cpf) {
      toast.error('❌ Preencha os campos obrigatórios');
      return;
    }

    if (!formData.foto) {
      toast.error('📸 Por favor, adicione uma foto');
      return;
    }

    setIsSubmitting(true);
    setAutomationStatus('Iniciando...');

    try {
      // Gerar ID único para o visitante
      const visitorId = automationService.generateVisitorId(
        formData.nome, 
        formData.cpf
      );

      // Preparar dados para automação
      const automationData: VisitorAutomationData = {
        name: formData.nome,
        cpf: formData.cpf,
        phone: formData.telefone,
        rg: formData.rg,
        placa_veiculo: formData.placaVeiculo,
        photo_base64: formData.foto // ⭐ FOTO INCLUÍDA!
      };

      console.log('🚀 Iniciando automação com foto para:', visitorId);

      // 4. INICIAR AUTOMAÇÃO
      const automationResult = await automationService.startAutomation(
        visitorId,
        automationData
      );

      if (!automationResult.success) {
        throw new Error(automationResult.error || 'Falha na automação');
      }

      setAutomationStatus('Processando cadastro...');
      
      if (automationResult.photo_received) {
        toast.success('📸 Foto enviada para processamento!');
      }

      // 5. MONITORAR PROGRESSO EM TEMPO REAL
      const finalStatus = await automationService.monitorAutomation(
        visitorId,
        (status) => {
          // Callback de atualização em tempo real
          const currentStatus = status.status.status;
          
          switch (currentStatus) {
            case 'pending':
              setAutomationStatus('⏳ Na fila de processamento...');
              break;
            case 'processing':
              setAutomationStatus('🤖 Cadastrando no HikCentral...');
              break;
            case 'completed':
              setAutomationStatus('✅ Cadastro concluído!');
              break;
            case 'failed':
              setAutomationStatus('❌ Falha no cadastro');
              break;
          }
        },
        300000 // 5 minutos timeout
      );

      // 6. RESULTADO FINAL
      if (finalStatus?.status.status === 'completed') {
        toast.success('🎉 Visitante cadastrado com sucesso no HikCentral!');
        toast.success('📸 Foto do rosto registrada para reconhecimento facial!');
        
        // Limpar formulário
        setFormData({
          nome: '',
          cpf: '',
          telefone: '',
          rg: '',
          placaVeiculo: '',
          foto: null
        });
        
        setAutomationStatus('Cadastro finalizado ✅');
        
      } else if (finalStatus?.status.status === 'failed') {
        const errorMsg = finalStatus.status.error_message || 'Erro desconhecido';
        toast.error(`❌ Falha no cadastro: ${errorMsg}`);
        setAutomationStatus(`Erro: ${errorMsg}`);
        
      } else {
        toast.warning('⏰ Timeout - Verifique o status manualmente');
        setAutomationStatus('Timeout na automação');
      }

    } catch (error) {
      console.error('Erro no processo:', error);
      toast.error(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setAutomationStatus('Erro no processo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        📸 Cadastro de Visitante com Foto
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campos básicos */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            CPF *
          </label>
          <input
            type="text"
            value={formData.cpf}
            onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="000.000.000-00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Telefone
          </label>
          <input
            type="text"
            value={formData.telefone}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            RG
          </label>
          <input
            type="text"
            value={formData.rg}
            onChange={(e) => setFormData(prev => ({ ...prev, rg: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="12.345.678-9"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Placa do Veículo
          </label>
          <input
            type="text"
            value={formData.placaVeiculo}
            onChange={(e) => setFormData(prev => ({ ...prev, placaVeiculo: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            placeholder="ABC-1234"
          />
        </div>

        {/* SEÇÃO DE FOTO */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-3">
            📸 Foto do Rosto * (para reconhecimento facial)
          </label>
          
          <div className="space-y-3">
            {/* Botões de captura */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                📷 Capturar da Câmera
              </button>
              
              <label className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer">
                📁 Carregar Arquivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview da foto */}
            {formData.foto && (
              <div className="border rounded p-4">
                <p className="text-sm text-gray-600 mb-2">Preview da foto:</p>
                <img
                  src={formData.foto}
                  alt="Preview"
                  className="max-w-xs h-48 object-cover border rounded"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, foto: null }))}
                  className="mt-2 text-red-500 text-sm hover:underline"
                >
                  🗑️ Remover foto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status da automação */}
        {automationStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm">
              <strong>Status:</strong> {automationStatus}
            </p>
          </div>
        )}

        {/* Botão de submit */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.foto}
          className="w-full bg-green-500 text-white py-3 rounded font-medium hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            '⏳ Processando...'
          ) : (
            '🚀 Cadastrar no HikCentral'
          )}
        </button>
      </form>

      {/* Informações adicionais */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-medium text-yellow-800 mb-2">
          ℹ️ Como funciona:
        </h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>1. Preencha os dados do visitante</li>
          <li>2. Capture ou carregue uma foto do rosto</li>
          <li>3. Clique em "Cadastrar no HikCentral"</li>
          <li>4. O sistema automaticamente:</li>
          <li className="ml-4">• Salva a foto no servidor</li>
          <li className="ml-4">• Executa script de automação</li>
          <li className="ml-4">• Preenche formulário no HikCentral</li>
          <li className="ml-4">• Faz upload da foto para reconhecimento facial</li>
          <li className="ml-4">• Confirma o cadastro</li>
          <li>5. Visitante fica liberado automaticamente! 🎉</li>
        </ul>
      </div>
    </div>
  );
}

// 7. EXEMPLO DE USO EM HOOKS/UTILITIES

export function useVisitorAutomation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');

  const processVisitor = async (
    visitorData: VisitorAutomationData,
    onStatusUpdate?: (status: string) => void
  ) => {
    setIsProcessing(true);
    setStatus('Iniciando...');

    try {
      const visitorId = automationService.generateVisitorId(
        visitorData.name,
        visitorData.cpf
      );

      // Iniciar automação
      const result = await automationService.startAutomation(visitorId, visitorData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Monitorar
      await automationService.monitorAutomation(
        visitorId,
        (automationStatus) => {
          const statusText = `${automationStatus.status.status} (Worker: ${automationStatus.status.worker_id})`;
          setStatus(statusText);
          onStatusUpdate?.(statusText);
        }
      );

      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setStatus(`Erro: ${errorMsg}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processVisitor,
    isProcessing,
    status
  };
}

export default ExemploVisitanteComFoto; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, User, CheckCircle } from 'lucide-react';
import { cpfVerificationService, type VisitanteExistente } from '@/services/cpfVerificationService';
import { hikVisionWebSDK } from '@/services/webSDKService';
import { toast } from 'sonner';

interface ReativarVisitanteProps {
  visitante: VisitanteExistente;
  linkData: {
    morador: string;
    moradorId: string;
    validDays: number;
    linkId: string;
  };
}

export default function ReativarVisitante({ visitante, linkData }: ReativarVisitanteProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<'waiting' | 'reactivating_db' | 'reactivating_hikvision' | 'completed'>('waiting');

  const handleReactivate = async () => {
    setIsProcessing(true);
    setProcessStep('reactivating_db');

    try {
      // 1. Atualizar visitante no banco de dados
      console.log('🔄 Iniciando reativação no banco...');
      const dbResult = await cpfVerificationService.reativarVisitante(
        visitante.id,
        linkData.moradorId,
        linkData.validDays
      );

      if (!dbResult.success) {
        throw new Error(dbResult.message);
      }

      console.log('✅ Visitante reativado no banco:', dbResult.data);
      toast.success('Visitante reativado no sistema!');

      // 2. Reativar no HikCentral via queue
      setProcessStep('reactivating_hikvision');
      
      const reactivationData = {
        nome: visitante.nome,
        cpf: visitante.cpf,
        telefone: visitante.telefone,
        moradorNome: linkData.morador,
        validadeDias: linkData.validDays,
        action: 'reactivate' // ⭐ NOVO: Flag para indicar reativação
      };

      console.log('🤖 Enviando para reativação no HikCentral...');
      const hikResult = await hikVisionWebSDK.createVisitorInAllDevices(reactivationData as any);

      if (!hikResult.success) {
        console.warn('⚠️ Falha na reativação automática do HikCentral:', hikResult.message);
        toast.warning('Visitante reativado no sistema, mas pode precisar reativar manualmente no HikCentral');
      } else {
        console.log('✅ Visitante reativado no HikCentral:', hikResult);
        toast.success('Visitante reativado com sucesso no HikCentral!');
      }

      setProcessStep('completed');
      
      // Redirecionar após sucesso
      setTimeout(() => {
        navigate(`/cadastro-sucesso?nome=${encodeURIComponent(visitante.nome)}&reativado=true`);
      }, 2000);

    } catch (error) {
      console.error('❌ Erro na reativação:', error);
      toast.error(`Erro na reativação: ${error}`);
      setProcessStep('waiting');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepStatus = (step: string) => {
    switch (processStep) {
      case 'waiting':
        return step === 'waiting' ? 'current' : 'pending';
      case 'reactivating_db':
        if (step === 'waiting') return 'completed';
        if (step === 'reactivating_db') return 'current';
        return 'pending';
      case 'reactivating_hikvision':
        if (step === 'waiting' || step === 'reactivating_db') return 'completed';
        if (step === 'reactivating_hikvision') return 'current';
        return 'pending';
      case 'completed':
        return 'completed';
      default:
        return 'pending';
    }
  };

  const getStepIcon = (step: string) => {
    const status = getStepStatus(step);
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'current') return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  const validadeAte = new Date();
  validadeAte.setDate(validadeAte.getDate() + linkData.validDays);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-primary">
            Reativar Visitante
          </CardTitle>
          <CardDescription>
            Renovar acesso para {linkData.morador}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações do Visitante */}
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Nome:</strong> {visitante.nome}</p>
                <p><strong>CPF:</strong> {visitante.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                <p><strong>Status atual:</strong> {visitante.status}</p>
                {visitante.morador_nome && (
                  <p><strong>Último acesso via:</strong> {visitante.morador_nome}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Informações da Reativação */}
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Novo morador:</strong> {linkData.morador}</p>
                <p><strong>Validade:</strong> {linkData.validDays} dia(s)</p>
                <p><strong>Válido até:</strong> {validadeAte.toLocaleDateString()} às 23:59</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Progresso da Reativação */}
          {isProcessing && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <p className="font-medium text-sm">Progresso da reativação:</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {getStepIcon('reactivating_db')}
                      <span className="text-sm">Atualizando no sistema</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStepIcon('reactivating_hikvision')}
                      <span className="text-sm">Reativando no HikCentral</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStepIcon('completed')}
                      <span className="text-sm">Concluído</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="space-y-3">
            <Button 
              onClick={handleReactivate}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reativando...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Reativar Visitante
                </>
              )}
            </Button>

            {!isProcessing && (
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="w-full"
              >
                Voltar
              </Button>
            )}
          </div>

          {processStep === 'completed' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Visitante reativado com sucesso! Redirecionando...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

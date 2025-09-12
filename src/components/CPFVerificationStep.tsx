import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, User, UserCheck, Clock } from 'lucide-react';
import { cpfVerificationService, type CPFVerificationResult, type VisitanteExistente } from '@/services/cpfVerificationService';
import { toast } from 'sonner';

interface CPFVerificationStepProps {
  onContinueAsNew: () => void;
  onContinueWithReactivation: (visitante: VisitanteExistente) => void;
  linkData: {
    morador: string;
    moradorId: string;
    validDays: number;
  };
}

export default function CPFVerificationStep({ 
  onContinueAsNew, 
  onContinueWithReactivation,
  linkData 
}: CPFVerificationStepProps) {
  const [cpf, setCpf] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessingReactivation, setIsProcessingReactivation] = useState(false);
  const [verificationResult, setVerificationResult] = useState<CPFVerificationResult | null>(null);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    setVerificationResult(null);
  };

  const handleVerifyAccount = async () => {
    if (cpf.replace(/\D/g, '').length !== 11) {
      toast.error('Por favor, digite um CPF válido');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await cpfVerificationService.verificarCPF(cpf);
      setVerificationResult(result);

      if (result.exists && result.visitante) {
        if (result.needsReactivation) {
          toast.info(`Visitante ${result.visitante.nome} encontrado - será reativado`);
        } else {
          toast.warning(result.message);
        }
      } else {
        toast.success('CPF não encontrado - será um novo cadastro');
      }
    } catch (error) {
      console.error('Erro na verificação:', error);
      toast.error('Erro ao verificar CPF. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinueWithReactivation = async () => {
    // ⭐ PREVENIR MÚLTIPLOS CLIQUES
    if (isProcessingReactivation) {
      console.log('⚠️ Reativação já em andamento - ignorando clique');
      return;
    }

    console.log('🔄 Botão reativar clicado');
    
    if (verificationResult?.visitante) {
      setIsProcessingReactivation(true);
      console.log('✅ Iniciando reativação IMEDIATA para:', verificationResult.visitante.nome);
      
      try {
        // ⭐ SEM DELAY - Transição imediata
        onContinueWithReactivation(verificationResult.visitante);
      } catch (error) {
        console.error('❌ Erro na reativação:', error);
        setIsProcessingReactivation(false);
      }
    } else {
      console.log('❌ Nenhum visitante encontrado para reativação');
    }
  };

  const getStatusIcon = () => {
    if (!verificationResult) return <Search className="h-5 w-5" />;
    
    if (!verificationResult.exists) {
      return <User className="h-5 w-5 text-green-600" />;
    }
    
    if (verificationResult.needsReactivation) {
      return <Clock className="h-5 w-5 text-orange-600" />;
    }
    
    return <UserCheck className="h-5 w-5 text-blue-600" />;
  };

  const getStatusColor = () => {
    if (!verificationResult) return 'bg-gray-50';
    
    if (!verificationResult.exists) return 'bg-green-50 border-green-200';
    if (verificationResult.needsReactivation) return 'bg-orange-50 border-orange-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary mb-2">
            Verificação de Conta
          </CardTitle>
          <CardDescription>
            Vamos verificar se você já possui cadastro em nosso sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Informações do Link */}
          <Alert>
            <AlertDescription>
              <strong>Convite de:</strong> {linkData.morador}<br/>
              <strong>Validade:</strong> {linkData.validDays} dia(s)
            </AlertDescription>
          </Alert>

          {/* Campo CPF */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              CPF para verificação
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                className="flex-1"
              />
              <Button 
                onClick={handleVerifyAccount}
                disabled={isVerifying || cpf.replace(/\D/g, '').length !== 11}
                size="sm"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Resultado da Verificação */}
          {verificationResult && (
            <Card className={`border-2 ${getStatusColor()}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon()}
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">
                      {verificationResult.message}
                    </p>
                    
                    {verificationResult.visitante && (
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Nome:</strong> {verificationResult.visitante.nome}</p>
                        <p><strong>Status:</strong> {verificationResult.visitante.status}</p>
                        <p><strong>Último morador:</strong> {verificationResult.visitante.morador_nome}</p>
                        {verificationResult.visitante.validade_fim && (
                          <p><strong>Última validade:</strong> {new Date(verificationResult.visitante.validade_fim).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          {verificationResult && (
            <div className="space-y-3">
              {!verificationResult.exists ? (
                <Button 
                  onClick={onContinueAsNew}
                  className="w-full"
                  size="lg"
                >
                  <User className="h-4 w-4 mr-2" />
                  Continuar com Novo Cadastro
                </Button>
              ) : verificationResult.needsReactivation ? (
                <Button 
                  onClick={handleContinueWithReactivation}
                  disabled={isProcessingReactivation}
                  className="w-full"
                  size="lg"
                >
                  {isProcessingReactivation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Reativar para {linkData.morador}
                    </>
                  )}
                </Button>
              ) : (
                <Alert>
                  <AlertDescription>
                    Este visitante já está ativo. Entre em contato com a administração se precisar de ajuda.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Botão de Continuar sem Verificar */}
          {!verificationResult && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Ou se preferir:
              </p>
              <Button 
                variant="outline" 
                onClick={onContinueAsNew}
                className="w-full"
              >
                Continuar Direto para Cadastro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

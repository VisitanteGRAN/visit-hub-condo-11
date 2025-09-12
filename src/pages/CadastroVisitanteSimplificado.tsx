import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Phone, 
  FileText,
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  Building2,
  Car
} from 'lucide-react';
import CPFVerificationStep from '@/components/CPFVerificationStep';
import ReativarVisitante from '@/pages/ReativarVisitante';
import { type VisitanteExistente } from '@/services/cpfVerificationService';
import { toast } from 'sonner';
import hikVisionWebSDK from '@/services/webSDKService';
import logoCondominio from '@/assets/logo-condominio.png';
import { supabase } from '@/integrations/supabase/client';
import { CameraCapture } from '@/components/ui/camera-capture';

interface VisitanteData {
  nome: string;
  sobrenome: string;
  cpf: string;
  telefone: string;
  documento: string;
  tipoDocumento: string;
  placaVeiculo: string;
  genero: string;
  observacoes: string;
  foto: string | null;
}

export default function CadastroVisitanteSimplificado() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<VisitanteData>({
    nome: '',
    sobrenome: '',
    cpf: '',
    telefone: '',
    documento: '',
    tipoDocumento: 'RG',
    placaVeiculo: '',
    genero: 'Masculino',
    observacoes: '',
    foto: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // ⭐ NOVOS ESTADOS PARA VERIFICAÇÃO CPF
  const [currentStep, setCurrentStep] = useState<'verification' | 'form' | 'reactivation'>('verification');
  const [visitanteToReactivate, setVisitanteToReactivate] = useState<VisitanteExistente | null>(null);

  useEffect(() => {
    validateLink();
  }, [linkId]);

  const validateLink = async () => {
    try {
      setIsLoading(true);
      
      const { data: linkData, error } = await supabase
        .from('links_convite')
        .select(`
          *,
          morador:usuarios(nome, unidade)
        `)
        .eq('token', linkId)
        .eq('usado', false)
        .eq('expirado', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !linkData) {
        console.error('❌ Link inválido:', error);
        setLinkValid(false);
        toast.error('Link inválido ou expirado');
        return;
      }

      console.log('✅ Link válido encontrado:', linkData);
      setLinkValid(true);
      setLinkData({
        morador: (linkData as any).morador.nome,
        unidade: (linkData as any).morador.unidade,
        validDays: (linkData as any).validade_dias,
        expiresAt: (linkData as any).expires_at,
        moradorId: (linkData as any).morador_id,
        linkId: (linkData as any).id
      });
      
    } catch (error) {
      console.error('❌ Erro ao validar link:', error);
      setLinkValid(false);
      toast.error('Erro ao validar link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof VisitanteData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCameraCapture = (photoData: string) => {
    setFormData(prev => ({ ...prev, foto: photoData }));
    setPhotoPreview(photoData);
    setShowCamera(false);
    toast.success('Foto capturada com sucesso!');
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, foto: null }));
    setPhotoPreview(null);
  };

  // ⭐ CALLBACKS PARA VERIFICAÇÃO CPF
  const handleContinueAsNew = () => {
    setCurrentStep('form');
  };

  const handleContinueWithReactivation = (visitante: VisitanteExistente) => {
    console.log('📋 Recebido visitante para reativação:', visitante);
    console.log('🔄 Mudando step para reactivation...');
    
    // Verificar se já não está em processo de reativação
    if (currentStep === 'reactivation') {
      console.log('⚠️ Reativação já em andamento - ignorando');
      return;
    }
    
    setVisitanteToReactivate(visitante);
    setCurrentStep('reactivation');
    console.log('✅ Step alterado, renderizando ReativarVisitante');
  };

  // ⭐ NOVO: Reset em caso de erro na reativação
  const handleReactivationError = () => {
    console.log('🔄 Resetando fluxo devido a erro na reativação');
    setCurrentStep('verification');
    setVisitanteToReactivate(null);
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.nome.trim()) errors.push('Nome é obrigatório');
    if (!formData.cpf.trim()) errors.push('CPF é obrigatório');
    if (!formData.telefone.trim()) errors.push('Telefone é obrigatório');
    if (!formData.documento.trim()) errors.push('Documento é obrigatório');
    if (!formData.foto) errors.push('Foto é obrigatória para reconhecimento facial');

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(`Corrija os seguintes erros:\n${errors.join('\n')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Iniciando cadastro de visitante nos coletores...');

      // Preparar dados do visitante
      const nomeCompleto = `${formData.nome} ${formData.sobrenome}`.trim();
      const visitorData = {
        nome: nomeCompleto,
        cpf: formData.cpf,
        telefone: formData.telefone,
        documento: formData.documento,
        tipo_documento: formData.tipoDocumento,
        placa_veiculo: formData.placaVeiculo,
        genero: formData.genero,
        observacoes: formData.observacoes,
        morador_id: linkData.moradorId,
        link_convite_id: linkData.linkId,
        foto: formData.foto,
        moradorNome: linkData.morador,
        unidade: linkData.unidade,
        validadeDias: linkData.validDays
      };

      // Salvar no banco de dados
      const { data: visitanteData, error: visitanteError } = await supabase
        .from('visitantes')
        .insert({
          nome: nomeCompleto,
          cpf: formData.cpf,
          telefone: formData.telefone,
          documento: formData.documento,
          tipo_documento: formData.tipoDocumento,
          observacoes: formData.observacoes,
          morador_id: linkData.moradorId,
          link_convite_id: linkData.linkId,
          hikvision_user_id: '',
          validade_inicio: new Date().toISOString(),
          validade_fim: new Date(Date.now() + linkData.validDays * 24 * 60 * 60 * 1000).toISOString(),
          unidade: linkData.unidade
          // Removido foto_url que não existe na tabela
        } as any)
        .select()
        .single();

      if (visitanteError) {
        throw new Error(`Erro ao salvar visitante: ${visitanteError.message}`);
      }

      // Criar visitante no HikCentral
      const result = await hikVisionWebSDK.createVisitorInAllDevices(visitorData as any);
      
      if (!result.success) {
        throw new Error(result.message || 'Falha ao criar visitante no HikCentral');
      }

      console.log('✅ Visitante criado com sucesso:', result);

      // Marcar link como usado
      await supabase
        .from('links_convite')
        .update({ usado: true } as any)
        .eq('id', linkData.linkId);

      toast.success('Cadastro realizado com sucesso!');
      navigate(`/cadastro-sucesso?nome=${encodeURIComponent(nomeCompleto)}`);

    } catch (error: any) {
      console.error('❌ Erro ao criar visitante no HikCentral:', error);
      
      const errorMessage = error.message || 'Erro desconhecido ao processar cadastro';
      toast.error(`Erro no cadastro: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light to-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Validando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!linkValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-destructive/10 to-background flex items-center justify-center p-4">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Link Inválido</h1>
            <p className="text-muted-foreground mb-4">
              Este link de convite é inválido ou já foi utilizado.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ⭐ RENDERIZAÇÃO CONDICIONAL BASEADA NO STEP
  if (currentStep === 'verification') {
    return (
      <CPFVerificationStep
        onContinueAsNew={handleContinueAsNew}
        onContinueWithReactivation={handleContinueWithReactivation}
        linkData={linkData}
      />
    );
  }

  if (currentStep === 'reactivation' && visitanteToReactivate) {
    return (
      <ReativarVisitante
        visitante={visitanteToReactivate}
        linkData={linkData}
        onError={handleReactivationError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src={logoCondominio} 
            alt="Logo Gran Royalle" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Gran Royalle</h1>
          </div>
          <p className="text-muted-foreground">Cadastro de Visitante</p>
        </div>

        {/* Link Info */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Convite Válido</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Convidado por <strong>{linkData?.morador}</strong> ({linkData?.unidade})
            </p>
            <p className="text-sm text-muted-foreground">
              Válido por <strong>{linkData?.validDays} dia(s)</strong>
            </p>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Visitante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Primeiro nome"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input
                    id="sobrenome"
                    value={formData.sobrenome}
                    onChange={(e) => handleInputChange('sobrenome', e.target.value)}
                    placeholder="Sobrenome (opcional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genero">Gênero *</Label>
                  <Select 
                    value={formData.genero} 
                    onValueChange={(value) => handleInputChange('genero', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Desconhecido">Desconhecido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                  <Select 
                    value={formData.tipoDocumento} 
                    onValueChange={(value) => handleInputChange('tipoDocumento', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RG">RG</SelectItem>
                      <SelectItem value="CNH">CNH</SelectItem>
                      <SelectItem value="Passaporte">Passaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documento">Número do Documento *</Label>
                  <Input
                    id="documento"
                    value={formData.documento}
                    onChange={(e) => handleInputChange('documento', e.target.value)}
                    placeholder="Número do documento"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="placaVeiculo">Placa do Veículo</Label>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="placaVeiculo"
                    value={formData.placaVeiculo}
                    onChange={(e) => handleInputChange('placaVeiculo', e.target.value)}
                    placeholder="ABC-1234 (opcional)"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Informe apenas se você estiver dirigindo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais (opcional)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Foto para Reconhecimento Facial *</Label>
                
                {photoPreview ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <img 
                        src={photoPreview} 
                        alt="Foto capturada" 
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removePhoto}
                        className="absolute top-2 right-2"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCamera(true)}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Tirar Nova Foto
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCamera(true)}
                    className="w-full h-20 border-dashed"
                  >
                    <Camera className="h-6 w-6 mr-2" />
                    Tirar Foto
                  </Button>
                )}

                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertDescription>
                    A foto é necessária para o sistema de reconhecimento facial na portaria.
                  </AlertDescription>
                </Alert>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando Cadastro...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar Cadastro
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Capturar Foto</CardTitle>
              </CardHeader>
              <CardContent>
                <CameraCapture 
                  onCapture={handleCameraCapture}
                  onClose={() => setShowCamera(false)}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 
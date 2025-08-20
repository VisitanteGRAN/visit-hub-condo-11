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
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import hikVisionWebSDK from '@/services/webSDKService';
import logoCondominio from '@/assets/logo-condominio.png';
import { supabase } from '@/integrations/supabase/client';
import { CameraCapture } from '@/components/ui/camera-capture';

interface VisitanteData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  documento: string;
  tipoDocumento: string;
  observacoes: string;
  foto: string | null;
}

export default function CadastroVisitante() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<VisitanteData>({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    documento: '',
    tipoDocumento: 'RG',
    observacoes: '',
    foto: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    validateLink();
  }, [linkId]);

  const validateLink = async () => {
    try {
      setIsLoading(true);
      
      // Validar link no banco de dados
      const { data: linkData, error } = await supabase
        .from('links_convite')
        .select(`
          *,
          morador:usuarios(nome, unidade, email)
        `)
        .eq('token', linkId) // Usar 'token' em vez de 'link_id'
        .eq('usado', false) // Usar 'usado' em vez de 'ativo'
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
        morador: linkData.morador.nome,
        unidade: linkData.morador.unidade,
        validDays: linkData.validade_dias, // Usar 'validade_dias' em vez de 'valid_days'
        expiresAt: linkData.expires_at,
        moradorId: linkData.morador_id,
        linkId: linkData.id
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

  const handlePhotoCapture = (imageData: string) => {
    setPhotoPreview(imageData);
    setFormData(prev => ({
      ...prev,
      foto: imageData
    }));
    toast.success('Foto capturada com sucesso!');
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({
      ...prev,
      foto: null
    }));
  };

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.nome.trim()) {
      toast.error('Por favor, informe seu nome completo');
      return;
    }
    
    if (!validateCPF(formData.cpf)) {
      toast.error('CPF inválido');
      return;
    }
    
    if (!formData.telefone.trim()) {
      toast.error('Por favor, informe seu telefone');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Por favor, informe seu e-mail');
      return;
    }
    
    if (!formData.documento.trim()) {
      toast.error('Por favor, informe seu documento');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Iniciando cadastro de visitante nos coletores...');
      
      // 1. Criar usuário no HikCentral via WebSDK
      const visitorData = {
        nome: formData.nome,
        cpf: formData.cpf.replace(/\D/g, ''),
        telefone: formData.telefone,
        email: formData.email,
        documento: formData.documento,
        foto: formData.foto || undefined,
        // Dados do morador para vincular no HikCentral
        moradorNome: linkData?.morador?.nome || 'Morador',
        moradorUnidade: linkData?.unidade || 'Unidade não informada',
        moradorId: linkData?.moradorId,
        validadeDias: linkData?.validDays || 1
      };

      const hikCentralResult = await hikVisionWebSDK.createVisitorInAllDevices(visitorData);

      if (hikCentralResult.success) {
        console.log('✅ Visitante criado no HikCentral:', hikCentralResult.data?.hikCentralId);
        console.log('👥 Associado ao morador:', hikCentralResult.data?.visitado);
        console.log('🕐 Validade até:', hikCentralResult.data?.validade);
        
        // 2. Salvar no banco de dados local
        const { data: visitanteData, error: dbError } = await supabase
          .from('visitantes')
          .insert({
            nome: formData.nome,
            cpf: formData.cpf.replace(/\D/g, ''),
            telefone: formData.telefone,
            email: formData.email,
            documento: formData.documento,
            tipo_documento: formData.tipoDocumento,
            observacoes: formData.observacoes,
            morador_id: linkData.moradorId,
            link_convite_id: linkData.linkId,
            hikvision_user_id: formData.cpf.replace(/\D/g, ''), // Usar CPF como ID
            status: 'ativo',
            validade_inicio: new Date().toISOString(),
            validade_fim: new Date(Date.now() + (linkData.validDays || 1) * 24 * 60 * 60 * 1000).toISOString(),
            unidade: linkData.unidade
          })
          .select()
          .single();

        if (dbError) {
          console.error('❌ Erro ao salvar no banco:', dbError);
          toast.error('Erro ao salvar dados. Tente novamente.');
          return;
        }

        console.log('✅ Visitante salvo no banco:', visitanteData);
        
        // 3. Foto já foi enviada durante a criação do usuário via WebSDK
        if (formData.foto) {
          console.log('✅ Foto incluída no cadastro dos coletores');
        }
        
        // 4. Marcar link como usado
        await supabase
          .from('links_convite')
          .update({ usado: true, usado_em: new Date().toISOString() })
          .eq('id', linkData.linkId);
        
        toast.success('Cadastro realizado com sucesso! Você já pode acessar o condomínio.');
        
        // Redirecionar para página de sucesso
        setTimeout(() => {
          navigate('/cadastro-sucesso');
        }, 2000);
        
      } else {
        console.error('❌ Erro ao criar visitante no HikCentral:', hikCentralResult.message);
        toast.error(`Erro ao cadastrar no HikCentral: ${hikCentralResult.message}`);
      }
      
    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      toast.error('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Validando link de convite...</p>
        </div>
      </div>
    );
  }

  if (!linkValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Link Inválido</h2>
            <p className="text-muted-foreground">
              Este link de convite é inválido ou expirou. Entre em contato com o morador.
            </p>
          </CardContent>
        </Card>
      </div>
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
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
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
                <Label>Foto para Reconhecimento Facial</Label>
                
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
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Tirar Foto
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground">
                  A foto será usada para reconhecimento facial na entrada do condomínio
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Importante:</strong> Ao cadastrar, você será automaticamente registrado no sistema de controle de acesso. 
                  Sua foto (se fornecida) será usada para reconhecimento facial na entrada do condomínio.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cadastrando...
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
      </div>
      
      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
          title="Foto para Reconhecimento Facial"
        />
      )}
    </div>
  );
} 
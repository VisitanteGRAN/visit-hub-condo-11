import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Home, CreditCard, Mail, Lock, Building2, Camera, FileText, X, Check, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import logoCondominio from '@/assets/logo-condominio.png';
import { logger } from '@/utils/secureLogger';
import CameraCapture from '@/components/ui/camera-capture';

interface CadastroMoradorData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  cpf: string;
  rg: string;
  telefone: string;
  rua: string;
  numeroRua: string;
  foto: string;
}

export default function CadastroMorador() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CadastroMoradorData>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cpf: '',
    rg: '',
    telefone: '',
    rua: '',
    numeroRua: '',
    foto: ''
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleInputChange = (field: keyof CadastroMoradorData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    
    // Validação básica de CPF
    const digits = numbers.split('').map(Number);
    
    // Verifica se todos os dígitos são iguais
    if (digits.every(digit => digit === digits[0])) return false;
    
    return true; // Validação simplificada
  };

  const formatTelefone = (telefone: string) => {
    const numbers = telefone.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    if (formatted.length <= 14) { // CPF formatado tem 14 caracteres
      handleInputChange('cpf', formatted);
    }
  };

  const handleTelefoneChange = (value: string) => {
    const formatted = formatTelefone(value);
    if (formatted.length <= 15) { // Telefone formatado tem até 15 caracteres
      handleInputChange('telefone', formatted);
    }
  };

  const validateForm = () => {
    // Validações
    if (!formData.nome.trim()) {
      toast.error('Por favor, informe seu nome completo');
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error('Por favor, informe seu e-mail');
      return false;
    }
    
    if (!formData.telefone.trim()) {
      toast.error('Por favor, informe seu telefone');
      return false;
    }
    
    if (!formData.rua.trim()) {
      toast.error('Por favor, informe o nome da rua');
      return false;
    }
    
    if (!formData.numeroRua.trim()) {
      toast.error('Por favor, informe o número da rua');
      return false;
    }
    
    if (!validateCPF(formData.cpf)) {
      toast.error('CPF inválido');
      return false;
    }
    
    if (!formData.rg.trim()) {
      toast.error('Por favor, informe seu RG');
      return false;
    }
    
    if (formData.senha.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return false;
    }
    
    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return false;
    }
    
    if (!formData.foto.trim()) {
      toast.error('Por favor, tire uma foto para seu cadastro');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário primeiro
    if (!validateForm()) {
      return;
    }

    // Mostrar modal de termos
    setShowTermsModal(true);
  };

  const handleAcceptTerms = async () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    setIsSubmitting(true);
    
    try {
      logger.info('🏠 Registrando novo morador', { formData: '[SANITIZED]' });
      
      const enderecoCompleto = `${formData.rua}, ${formData.numeroRua}`;
      
      // 📸 DEBUG: Verificar se foto está sendo passada
      console.log('📸 Foto no formData:', formData.foto ? 'PRESENTE ✅' : 'AUSENTE ❌');
      if (formData.foto) {
        console.log('📸 Tamanho da foto:', formData.foto.length, 'caracteres');
      }
      
      const success = await register(
        formData.email,
        formData.senha,
        formData.nome,
        'morador',
        enderecoCompleto,
        formData.cpf, // 📱 INCLUIR CPF
        formData.telefone, // 📞 INCLUIR TELEFONE
        formData.foto // 📸 INCLUIR FOTO
      );
      
      if (success) {
        toast.success('Cadastro realizado com sucesso! Aguarde a aprovação do administrador para fazer login.');
        navigate('/login');
      } else {
        toast.error('Erro ao realizar cadastro. Tente novamente.');
      }
      
    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      toast.error('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectTerms = () => {
    setShowTermsModal(false);
    toast.info('É necessário aceitar os termos para prosseguir com o cadastro.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={logoCondominio} alt="Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Cadastro de Morador
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Crie sua conta para gerenciar visitantes
          </p>
        </div>

        <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-primary/10 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              Dados do Morador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              autoComplete="off"
              noValidate
            >
              {/* Dados Pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Seu nome completo"
                    autoComplete="off"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    CPF *
                  </Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleCPFChange(e.target.value)}
                    placeholder="000.000.000-00"
                    autoComplete="off"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Será usado para vincular seus visitantes
                  </p>
                </div>
              </div>

              {/* RG e Telefone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rg" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    RG *
                  </Label>
                  <Input
                    id="rg"
                    value={formData.rg}
                    onChange={(e) => handleInputChange('rg', e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    placeholder="Ex: MG12345678"
                    autoComplete="off"
                    maxLength={15}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone *
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleTelefoneChange(e.target.value)}
                    placeholder="(31) 99999-9999"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail (Gmail recomendado) *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu.email@gmail.com"
                  autoComplete="off"
                  required
                />
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="rua" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Nome da Rua *
                  </Label>
                  <Input
                    id="rua"
                    value={formData.rua}
                    onChange={(e) => handleInputChange('rua', e.target.value)}
                    placeholder="Ex: Rua das Flores"
                    autoComplete="off"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="numeroRua" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Número *
                  </Label>
                  <Input
                    id="numeroRua"
                    value={formData.numeroRua}
                    onChange={(e) => handleInputChange('numeroRua', e.target.value)}
                    placeholder="123"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              {/* Foto do Morador */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Foto do Rosto *
                </Label>
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
                        onClick={() => {
                          setPhotoPreview(null);
                          handleInputChange('foto', '');
                        }}
                        className="absolute top-2 right-2"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPhotoPreview(null);
                        handleInputChange('foto', '');
                      }}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Tirar Nova Foto
                    </Button>
                  </div>
                ) : (
                  <CameraCapture
                    onPhotoCapture={(photoBase64) => {
                      handleInputChange('foto', photoBase64);
                      setPhotoPreview(photoBase64);
                    }}
                    showUpload={false}
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Tire uma foto clara do seu rosto para identificação
                </p>
              </div>

              {/* Senha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senha" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Senha *
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => handleInputChange('senha', e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirmar Senha *
                  </Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    required
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="flex-1"
                >
                  Voltar ao Login
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </div>
            </form>

            {/* Informações */}
            <Alert className="mt-6">
              <User className="h-4 w-4" />
              <AlertDescription>
                <strong>Por que CPF?</strong><br />
                O CPF será usado para vincular automaticamente os visitantes que você autorizar. 
                Seus dados ficam seguros e são usados apenas para gerenciamento interno.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Modal de Termos de Aceitação */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5" />
                  Termo de Aceitação - Associação Gran Royalle
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[60vh] space-y-4 text-sm">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">DADOS DO PROPRIETÁRIO:</h3>
                  <p className="text-blue-800">
                    <strong>{formData.nome}</strong><br />
                    <strong>CPF:</strong> {formData.cpf}<br />
                    <strong>E-mail:</strong> {formData.email}<br />
                    <strong>Cel.:</strong> {formData.telefone}<br />
                    <strong>Endereço:</strong> {formData.rua}, {formData.numeroRua}, Bairro: Condomínio Gran Royalle<br />
                    <strong>Cidade:</strong> Confins <strong>CEP:</strong> 33500-000
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">DECLARAÇÃO</h3>
                  
                  <p className="mb-4 leading-relaxed">
                    Declaro para os devidos fins que sou o real adquirente/proprietário do imóvel representado pelo 
                    <strong> lote 15 da quadra 18</strong> e, nesta condição, ratifico minha associação à 
                    <strong> Associação do Residencial Gran Royalle Aeroporto Confins</strong>, nos termos da cláusula sexta, 
                    parágrafo primeiro, do contrato originário do referido imóvel, abaixo transcrita, bem como nos termos do 
                    art. 78 da lei 13.465/17, contrato este referente a primeira venda feita pela incorporadora deste loteamento, 
                    <strong> Gran Viver Urbanismo S/A</strong>, que se transcreve abaixo:
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
                    <h4 className="font-semibold mb-2">"Cláusula Sexta – Benfeitorias e Obrigações Acessórias dos Compradores"</h4>
                    <p className="leading-relaxed mb-3">
                      Os compradores declaram ter conhecimento das Leis e normas editadas pelo IBAMA, IEF e os demais órgãos 
                      responsáveis pela proteção ambiental, e ainda ter ciência de que o imóvel objeto desta promessa está 
                      sujeito às leis e normas que tratam das definições de uso e ocupação do solo urbano editadas pela 
                      Prefeitura Municipal, e assume o compromisso de respeitar todas estas normas de conservação.
                    </p>
                    
                    <h5 className="font-semibold mb-2">Parágrafo primeiro</h5>
                    <p className="leading-relaxed">
                      Os compradores declaram também expressamente que leram, entenderam e receberam uma cópia da minuta do 
                      estatuto da <strong>Associação do Residencial Gran Royalle Aeroporto</strong>, Associação que os compradores 
                      se obrigam a filiar, obrigando-se por si, seus herdeiros ou sucessores, a respeitar em todos os seus termos, 
                      as normas inseridas no referido documento, no seu regulamento interno e em outros regulamentos que venham a 
                      ser aprovados pela referida entidade, que passam a fazer parte integrante do presente contrato para todos os 
                      fins de direito.
                    </p>
                  </div>

                  <p className="leading-relaxed font-medium mb-6">
                    Declaro ainda ter <strong>conhecimento das normas do Estatuto</strong>, <strong>regimento interno</strong> e 
                    <strong> regras de utilização do clube e academia</strong>.
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg border mt-6">
                    <p className="text-center mb-4">
                      <strong>Confins, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Nome:</strong> {formData.nome}
                      </div>
                      <div>
                        <strong>CI:</strong> {formData.rg}
                      </div>
                      <div>
                        <strong>CPF:</strong> {formData.cpf}
                      </div>
                      <div>
                        <strong>E-mail:</strong> {formData.email}
                      </div>
                      <div>
                        <strong>Telefone:</strong> {formData.telefone}
                      </div>
                      <div>
                        <strong>Endereço:</strong> {formData.rua}, {formData.numeroRua}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <div className="p-6 border-t bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRejectTerms}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Não Aceito
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleAcceptTerms}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Aceito os Termos
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-gray-600 mt-3 text-center">
                  Ao aceitar, você concorda com todos os termos e condições da Associação Gran Royalle
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 
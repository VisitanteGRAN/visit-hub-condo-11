import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Home, CreditCard, Mail, Lock, Building2, Camera } from 'lucide-react';
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
    telefone: '',
    rua: '',
    numeroRua: '',
    foto: ''
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.nome.trim()) {
      toast.error('Por favor, informe seu nome completo');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Por favor, informe seu e-mail');
      return;
    }
    
    if (!formData.telefone.trim()) {
      toast.error('Por favor, informe seu telefone');
      return;
    }
    
    if (!formData.rua.trim()) {
      toast.error('Por favor, informe o nome da rua');
      return;
    }
    
    if (!formData.numeroRua.trim()) {
      toast.error('Por favor, informe o número da rua');
      return;
    }
    
    if (!validateCPF(formData.cpf)) {
      toast.error('CPF inválido');
      return;
    }
    
    if (formData.senha.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    
    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (!formData.foto.trim()) {
      toast.error('Por favor, tire uma foto para seu cadastro');
      return;
    }

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
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Contato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Telefone *
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleTelefoneChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    autoComplete="off"
                    required
                  />
                </div>
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
                    autoComplete="new-password"
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
                    autoComplete="new-password"
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
      </div>
    </div>
  );
} 
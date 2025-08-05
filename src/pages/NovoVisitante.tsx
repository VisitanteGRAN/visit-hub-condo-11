import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Phone, 
  FileText,
  ArrowLeft,
  Copy,
  Share,
  CheckCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

export default function NovoVisitante() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: ''
  });
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLink, setShowLink] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateLink = () => {
    if (!formData.firstName.trim()) {
      toast.error('Por favor, preencha o nome do visitante');
      return;
    }

    // Generate unique link with visitor name
    const firstName = formData.firstName.toLowerCase().replace(/\s+/g, '');
    const randomId = Math.random().toString(36).substring(2, 8);
    const link = `https://condominio.app/visitante/${firstName}-${randomId}`;
    
    setGeneratedLink(link);
    setShowLink(true);
    toast.success(`Link criado para ${formData.firstName}! Compartilhe o link com seu visitante.`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success('Link copiado para a área de transferência!');
    } catch (err) {
      toast.error('Erro ao copiar link');
    }
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Convite de Visitante',
        text: `Você foi autorizado a visitar o condomínio. Use este link: ${generatedLink}`,
        url: generatedLink,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div 
      className="min-h-screen bg-background relative overflow-hidden"
      style={{
        backgroundImage: 'url(/lovable-uploads/88120252-9c46-4bf9-a5c8-48a57400b8be.png)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-background/90 dark:bg-background/95"></div>
      
      <DashboardLayout title="Novo Visitante">
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="hover:scale-105 transition-transform duration-200 bg-white/80 dark:bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
            >
              <Link to="/meus-visitantes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Novo Visitante</h2>
              <p className="text-muted-foreground">Gere um link de convite personalizado</p>
            </div>
          </div>

          <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <User className="h-5 w-5" />
                Dados do Visitante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground font-medium">Primeiro Nome do Visitante *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Ex: Maria"
                      required
                      className="bg-white dark:bg-background border-border hover:border-primary/50 focus:border-primary transition-colors duration-200"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 O visitante informará os dados completos ao usar o link gerado
                    </p>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={generateLink}
                    className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={showLink}
                  >
                    {showLink ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Link Gerado
                      </>
                    ) : (
                      <>
                        <Share className="h-4 w-4 mr-2" />
                        Gerar Link de Convite
                      </>
                    )}
                  </Button>
                </div>

                {showLink && (
                  <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 animate-fade-in">
                    <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Link Gerado com Sucesso!
                    </h3>
                    <div className="bg-white dark:bg-background p-3 rounded border border-border break-all text-sm font-mono">
                      {generatedLink}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        onClick={copyLink}
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:scale-105 transition-transform duration-200 border-primary/30 hover:border-primary"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                      </Button>
                      <Button 
                        onClick={shareLink}
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:scale-105 transition-transform duration-200 border-primary/30 hover:border-primary"
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-primary/10 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Informe apenas o primeiro nome do visitante</p>
              <p>• Clique em "Gerar Link de Convite" para criar um link personalizado</p>
              <p>• Compartilhe o link via WhatsApp, SMS ou e-mail</p>
              <p>• O visitante preencherá os dados completos ao usar o link</p>
              <p className="text-primary font-medium">💡 Processo simplificado: só o nome é necessário</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </div>
  );
}
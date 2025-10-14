import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/secureLogger';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor, digite seu e-mail');
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Por favor, digite um e-mail válido');
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se o usuário existe no sistema
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, email, nome, ativo, status')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !userData) {
        toast.error('E-mail não encontrado no sistema');
        setIsLoading(false);
        return;
      }

      // Verificar se o usuário está ativo
      if (!userData.ativo || userData.status !== 'ativo') {
        toast.error('Usuário inativo. Entre em contato com o administrador.');
        setIsLoading(false);
        return;
      }

      // Enviar email de recuperação via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Erro ao enviar email de recuperação:', error);
        toast.error('Erro ao enviar e-mail de recuperação. Tente novamente.');
        return;
      }

      logger.info('Email de recuperação enviado', { email });
      setEmailSent(true);
      toast.success('E-mail de recuperação enviado com sucesso!');

    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      toast.error('Erro interno. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Building2 className="h-6 w-6" />
              <CardTitle className="text-2xl font-bold">Gran Royalle</CardTitle>
            </div>
            <CardDescription>
              E-mail de recuperação enviado
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>E-mail enviado com sucesso!</strong>
                <br />
                Verifique sua caixa de entrada e spam. O link de recuperação expira em 1 hora.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>E-mail enviado para:</strong> {email}</p>
                <p>Clique no link recebido para redefinir sua senha.</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setEmailSent(false)}
                  variant="outline"
                  className="w-full"
                >
                  Enviar novamente
                </Button>
                
                <Button
                  asChild
                  variant="ghost"
                  className="w-full"
                >
                  <Link to="/login" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Login
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Building2 className="h-6 w-6" />
            <CardTitle className="text-2xl font-bold">Gran Royalle</CardTitle>
          </div>
          <CardDescription>
            Recuperar senha de acesso
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Digite seu e-mail cadastrado para receber as instruções de recuperação de senha.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail cadastrado</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar E-mail de Recuperação'}
            </Button>
          </form>

          <div className="text-center">
            <Button
              asChild
              variant="ghost"
              className="text-sm"
            >
              <Link to="/login" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

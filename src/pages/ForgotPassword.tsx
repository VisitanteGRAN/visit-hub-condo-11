import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/lib/supabase-admin';
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
      let userData = null;
      let userError = null;

      // DOUBLE PROTECTION: Tentar com supabaseAdmin primeiro
      try {
        console.log('🔍 Tentando verificar usuário com supabaseAdmin...');
        const result = await supabaseAdmin
          .from('usuarios')
          .select('id, email, nome, ativo, status')
          .eq('email', email.toLowerCase())
          .single();
        
        userData = result.data;
        userError = result.error;
        console.log('✅ supabaseAdmin resultado:', { userData: !!userData, error: userError?.message });
        
        // Se há erro (como "No API key found"), ativar fallback
        if (userError && (userError.message?.includes('No API key') || userError.message?.includes('apikey'))) {
          console.log('❌ supabaseAdmin com erro de API key, ativando fallback...');
          throw new Error('API key error - fallback needed');
        }
      } catch (adminError) {
        console.log('❌ supabaseAdmin falhou, tentando fetch direto...', adminError);
        
        // Fallback: Fetch direto com service key
        try {
          const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucGd0d3VnaGFweHh2dmNrZXBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAzMzUzOSwiZXhwIjoyMDcwNjA5NTM5fQ.2t6m1iUk_TRXtbEACh-P6dKJWRqyeLBe1OrUZemFd90";
          const url = `https://rnpgtwughapxxvvckepd.supabase.co/rest/v1/usuarios?select=id,email,nome,ativo,status&email=eq.${encodeURIComponent(email.toLowerCase())}`;
          
          console.log('🔄 Executando fetch direto para:', url);
          
          const response = await fetch(url, {
            headers: {
              'apikey': serviceKey,
              'authorization': `Bearer ${serviceKey}`,
              'content-type': 'application/json'
            }
          });

          console.log('📡 Resposta fetch:', { status: response.status, ok: response.ok });

          if (response.ok) {
            const users = await response.json();
            console.log('📋 Dados recebidos:', users);
            
            if (users && users.length > 0) {
              userData = users[0];
              userError = null;
              console.log('✅ Fetch direto funcionou! Usuário encontrado:', { nome: userData.nome, email: userData.email });
            } else {
              userError = { message: 'Usuário não encontrado' };
              console.log('❌ Fetch direto: array vazio, usuário não encontrado');
            }
          } else {
            const errorText = await response.text();
            userError = { message: `HTTP ${response.status}: ${errorText}` };
            console.log('❌ Fetch direto falhou:', { status: response.status, error: errorText });
          }
        } catch (fetchError) {
          console.error('❌ Fetch direto também falhou:', fetchError);
          userError = { message: 'Erro de conexão' };
        }
      }

      if (userError || !userData) {
        console.log('❌ Usuário não encontrado:', { email, error: userError });
        toast.error('E-mail não encontrado no sistema');
        setIsLoading(false);
        return;
      }

      console.log('✅ Usuário encontrado:', { email, ativo: userData.ativo, status: userData.status });

      // Verificar se o usuário está ativo
      if (!userData.ativo || userData.status !== 'ativo') {
        console.log('❌ Usuário inativo:', { email, ativo: userData.ativo, status: userData.status });
        toast.error('Usuário inativo. Entre em contato com o administrador.');
        setIsLoading(false);
        return;
      }

      // Determinar URL de redirecionamento correta
      const currentUrl = window.location.origin;
      const isProduction = currentUrl.includes('vercel.app') || currentUrl.includes('granroyalle');
      const redirectUrl = isProduction 
        ? 'https://granroyalle-visitantes.vercel.app/auth/callback'
        : `${currentUrl}/auth/callback`;
      
      console.log('🔗 URL de redirecionamento:', redirectUrl);

      // Enviar email de recuperação via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
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

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/secureLogger';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Verificar todos os parâmetros possíveis
      const type = searchParams.get('type');
      const tokenHash = searchParams.get('token_hash');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('🔄 Processando callback de autenticação:', { 
        type, 
        hasTokenHash: !!tokenHash, 
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        error: errorParam,
        allParams: Object.fromEntries(searchParams.entries())
      });

      // Verificar se há erro nos parâmetros
      if (errorParam) {
        console.error('❌ Erro no callback:', errorParam, errorDescription);
        setStatus('error');
        setMessage(errorDescription || 'Erro na autenticação.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Caso 1: Reset de senha via token hash (PKCE flow)
      if (type === 'recovery' && tokenHash) {
        console.log('🔑 Processando reset via token hash...');
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        });

        if (error) {
          console.error('❌ Erro ao verificar token de recuperação:', error);
          setStatus('error');
          setMessage('Link de recuperação inválido ou expirado.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        setStatus('success');
        setMessage('Link de recuperação válido! Redirecionando...');
        logger.info('Token de recuperação verificado com sucesso');
        
        setTimeout(() => navigate('/reset-password'), 2000);
        return;
      }

      // Caso 2: Reset de senha via access/refresh tokens (Implicit flow)
      if (accessToken && refreshToken) {
        console.log('🔑 Processando reset via tokens de acesso...');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('❌ Erro ao definir sessão:', error);
          setStatus('error');
          setMessage('Erro ao processar autenticação.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Verificar se é um reset de senha ou login normal
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('success');
          setMessage('Autenticação realizada com sucesso! Redirecionando...');
          logger.info('Sessão definida via callback');
          
          // Para reset de senha, redirecionar para página de reset
          // Para login normal, redirecionar para dashboard
          setTimeout(() => navigate('/reset-password'), 2000);
          return;
        }
      }

      // Caso 3: Apenas access token (alguns fluxos OAuth)
      if (accessToken && !refreshToken) {
        console.log('🔑 Processando com apenas access token...');
        // Tentar obter a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('success');
          setMessage('Autenticação realizada com sucesso! Redirecionando...');
          setTimeout(() => navigate('/reset-password'), 2000);
          return;
        }
      }

      // Se chegou aqui, não há parâmetros válidos ou reconhecidos
      console.warn('⚠️ Callback sem parâmetros válidos ou reconhecidos');
      console.log('📋 Parâmetros recebidos:', Object.fromEntries(searchParams.entries()));
      setStatus('error');
      setMessage('Link de autenticação inválido ou expirado.');
      setTimeout(() => navigate('/forgot-password'), 3000);

    } catch (error) {
      console.error('❌ Erro no callback de autenticação:', error);
      setStatus('error');
      setMessage('Erro interno. Tente novamente.');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-6">
            Gran Royalle
          </h1>

          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            )}
            {status === 'success' && (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
          </div>

          <p className={`text-sm ${
            status === 'success' ? 'text-green-600' : 
            status === 'error' ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            {message}
          </p>

          {status === 'error' && (
            <p className="text-xs text-muted-foreground mt-4">
              Você será redirecionado para a página de login em alguns segundos...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

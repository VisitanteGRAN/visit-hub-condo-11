import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import logoCondominio from '@/assets/logo-condominio.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    // Verificar se é admin (baseado no email)
    const isAdmin = email === 'admin@condominio.com.br';
    const role: UserRole = isAdmin ? 'admin' : 'morador';

    try {
      const success = await login(email, password, role);
      
      if (success) {
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error('Credenciais inválidas. Tente novamente.');
      }
    } catch (error: any) {
      console.log('🚨 Erro capturado no login:', error);
      
      // Capturar mensagens específicas de erro
      if (error.message && error.message.includes('ACESSO NEGADO')) {
        // Erro de aprovação - mostrar mensagem específica
        toast.error(error.message, {
          duration: 6000, // Mostrar por mais tempo
        });
      } else if (error.message && error.message.includes('USUÁRIO NÃO ENCONTRADO')) {
        // Usuário não cadastrado ou pendente
        toast.error(error.message, {
          duration: 6000,
        });
      } else if (error.message && error.message.includes('não encontrado')) {
        toast.error('Usuário não encontrado no sistema. Verifique suas credenciais.');
      } else {
        // Para qualquer outro erro, mostrar mensagem genérica
        toast.error('Credenciais inválidas ou erro no sistema. Tente novamente.');
      }
    }
  };

  const handleForgotPassword = () => {
    toast.info('Funcionalidade em desenvolvimento');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto mb-4">
            <img 
              src={logoCondominio} 
              alt="Logo Gran Royalle" 
              className="h-20 w-auto mx-auto"
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Building2 className="h-6 w-6" />
            <CardTitle className="text-2xl font-bold">VisitHub</CardTitle>
          </div>
          <CardDescription>
            Acesse sua conta para gerenciar visitantes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Login Direto */}
          <form onSubmit={handleLogin} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>


          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Primeiro acesso? 
              <button 
                onClick={() => navigate('/cadastro-morador')}
                className="text-primary hover:underline ml-1 font-medium"
              >
                Cadastre-se como morador
              </button>
            </p>
            
            <div className="text-center">
              <button
                onClick={handleForgotPassword}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Esqueci minha senha
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
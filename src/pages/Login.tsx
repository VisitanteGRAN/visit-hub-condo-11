import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Lock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import logoCondominio from '@/assets/logo-condominio.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('morador');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const success = await login(email, password, role);
    
    if (success) {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } else {
      toast.error('Credenciais inválidas. Tente novamente.');
    }
  };

  const handleQuickLogin = async (userType: 'admin' | 'morador') => {
    const credentials = {
      admin: {
        email: 'admin@condominio.com.br',
        password: 'Admin@123456',
        role: 'admin' as UserRole
      },
      morador: {
        email: 'morador@condominio.com.br', 
        password: 'Morador@123456',
        role: 'morador' as UserRole
      }
    };

    const cred = credentials[userType];
    setEmail(cred.email);
    setPassword(cred.password);
    setRole(cred.role);

    const success = await login(cred.email, cred.password, cred.role);
    
    if (success) {
      toast.success(`Login como ${userType} realizado com sucesso!`);
      navigate('/dashboard');
    } else {
      toast.error(`Erro ao fazer login como ${userType}. Verifique as configurações.`);
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
            <CardTitle className="text-2xl font-bold">Gran Royalle</CardTitle>
          </div>
          <CardDescription>
            Sistema de gestão de visitantes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Login Rápido */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Acesso Rápido:</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleQuickLogin('admin')}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <User className="h-4 w-4 mr-2" />
                Administrador
              </Button>
              <Button
                onClick={() => handleQuickLogin('morador')}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <User className="h-4 w-4 mr-2" />
                Morador
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou faça login manual
              </span>
            </div>
          </div>

          {/* Login Manual */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Acesso</Label>
              <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morador">Morador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

          <div className="text-center">
            <button
              onClick={handleForgotPassword}
              className="text-sm text-primary hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>

          {/* Informações de Acesso */}
                      <div className="mt-6 p-4 bg-accent rounded-lg text-sm">
              <p className="font-medium text-accent-foreground mb-2">Informações de Acesso:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><strong>Admin:</strong> admin@condominio.com.br | Admin@123456</p>
                <p><strong>Morador:</strong> morador@condominio.com.br | Morador@123456</p>
                <p><strong>Nota:</strong> Use os botões de acesso rápido acima</p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Morador novo? 
                <button 
                  onClick={() => navigate('/cadastro-morador')}
                  className="text-primary hover:underline ml-1"
                >
                  Crie sua conta aqui
                </button>
              </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
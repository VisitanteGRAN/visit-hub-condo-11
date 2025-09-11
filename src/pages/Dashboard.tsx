import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus, 
  Bell,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

function MoradorDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      {/* Boas-vindas */}
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao VisitHub, {user?.name}!</CardTitle>
          <CardDescription>
            Gerencie seus visitantes de forma fácil e segura
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Ações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Button asChild className="w-full h-24 flex-col text-lg">
              <Link to="/novo-visitante">
                <UserPlus className="h-8 w-8 mb-2" />
                Novo Visitante
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Button variant="outline" asChild className="w-full h-24 flex-col text-lg">
              <Link to="/meus-visitantes">
                <Users className="h-8 w-8 mb-2" />
                Meus Visitantes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Crie links personalizados para seus visitantes</p>
            <p>• Visitantes preenchem dados antecipadamente</p>
            <p>• Sistema registra automaticamente na portaria</p>
            <p>• Acompanhe status em tempo real</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Navegação Admin */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>

      {/* Boas-vindas Admin */}
      <Card>
        <CardHeader>
          <CardTitle>Painel do Administrador</CardTitle>
          <CardDescription>
            Gerencie cadastros de moradores
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Ação Principal Admin */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <Button asChild className="w-full h-24 flex-col text-lg">
            <Link to="/admin/approvals">
              <Users className="h-8 w-8 mb-2" />
              Gerenciar Cadastros Pendentes
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      {user?.role === 'admin' ? <AdminDashboard /> : <MoradorDashboard />}
    </DashboardLayout>
  );
}

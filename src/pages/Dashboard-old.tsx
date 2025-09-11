import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Bell, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data para moradores
const mockVisitorsToday = [
  { id: 1, name: 'Maria Silva', time: '14:30', status: 'aguardando', apartment: '101' },
  { id: 2, name: 'João Santos', time: '16:00', status: 'autorizado', apartment: '205' },
  { id: 3, name: 'Ana Costa', time: '18:30', status: 'aguardando', apartment: '304' },
];

function MoradorDashboard() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Este Mês</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 desde o mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Links Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Convites disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Visitas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Para amanhã
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Gerencie seus visitantes facilmente
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button asChild className="h-16 flex-col">
            <Link to="/novo-visitante">
              <UserPlus className="h-6 w-6 mb-2" />
              Novo Visitante
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-16 flex-col">
            <Link to="/meus-visitantes">
              <Users className="h-6 w-6 mb-2" />
              Meus Visitantes
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Today's Visitors */}
      <Card>
        <CardHeader>
          <CardTitle>Visitantes de Hoje</CardTitle>
          <CardDescription>
            Status atual dos seus visitantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockVisitorsToday.map((visitor) => (
              <div key={visitor.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <div>
                    <p className="font-medium">{visitor.name}</p>
                    <p className="text-sm text-muted-foreground">{visitor.time}</p>
                  </div>
                </div>
                <Badge variant={visitor.status === 'autorizado' ? 'default' : 'secondary'}>
                  {visitor.status === 'autorizado' ? 'Autorizado' : 'Aguardando'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Painel do Administrador</h2>
        <p className="text-muted-foreground">
          Gerencie cadastros de moradores pendentes
        </p>
      </div>
      
      {/* Card Principal */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Aprovação de Cadastros</CardTitle>
          <CardDescription className="text-base">
            Clique no botão abaixo para gerenciar os cadastros de moradores que aguardam aprovação
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link to="/admin/approvals">
            <Button size="lg" className="w-full md:w-auto px-8 py-3">
              <UserPlus className="h-5 w-5 mr-2" />
              Gerenciar Cadastros Pendentes
            </Button>
          </Link>
        </CardContent>
      </Card>
      
      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-blue-100 rounded-full">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium">1. Moradores se cadastram</p>
                <p className="text-muted-foreground">Novos moradores preenchem o formulário de cadastro</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-yellow-100 rounded-full">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium">2. Aguardam aprovação</p>
                <p className="text-muted-foreground">Os cadastros ficam pendentes até você aprovar</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-green-100 rounded-full">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium">3. Você aprova ou rejeita</p>
                <p className="text-muted-foreground">Após a aprovação, o morador pode acessar o sistema</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const content = user?.role === 'admin' ? <AdminDashboard /> : <MoradorDashboard />;

  return (
    <DashboardLayout title="Dashboard">
      {content}
    </DashboardLayout>
  );
}
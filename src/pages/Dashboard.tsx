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

// Mock data
const mockVisitorsToday = [
  { id: 1, name: 'Maria Silva', time: '14:30', status: 'aguardando', apartment: '101' },
  { id: 2, name: 'João Santos', time: '16:00', status: 'autorizado', apartment: '205' },
  { id: 3, name: 'Ana Costa', time: '18:30', status: 'aguardando', apartment: '304' },
];

const mockStats = {
  totalVisitors: 156,
  todayVisitors: 12,
  pendingApprovals: 5,
  activeVisitors: 3
};

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
              2 autorizados, 1 pendente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Aguardando autorização
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Mensagens não lidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Gerencie seus visitantes de forma rápida e fácil
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button asChild className="h-20 flex-col">
            <Link to="/novo-visitante">
              <UserPlus className="h-6 w-6 mb-2" />
              Cadastrar Novo Visitante
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-20 flex-col">
            <Link to="/meus-visitantes">
              <Users className="h-6 w-6 mb-2" />
              Ver Meus Visitantes
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visitantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalVisitors}</div>
            <p className="text-xs text-muted-foreground">
              +12% desde o mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.todayVisitors}</div>
            <p className="text-xs text-muted-foreground">
              Pico às 14:00 (8 visitantes)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos Agora</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeVisitors}</div>
            <p className="text-xs text-muted-foreground">
              Visitantes no condomínio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Administrativas</CardTitle>
          <CardDescription>
            Gerencie o sistema de visitantes do condomínio
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button asChild className="h-20 flex-col">
            <Link to="/gestao-visitantes">
              <Users className="h-6 w-6 mb-2" />
              Gestão de Visitantes
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-20 flex-col">
            <Link to="/relatorios">
              <TrendingUp className="h-6 w-6 mb-2" />
              Relatórios
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-20 flex-col">
            <Link to="/gestao-usuarios">
              <UserPlus className="h-6 w-6 mb-2" />
              Gestão de Usuários
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <CheckCircle className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm font-medium">Visitante autorizado</p>
                  <p className="text-xs text-muted-foreground">Maria Silva - Apto 101 - 14:30</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <AlertCircle className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-sm font-medium">Aguardando aprovação</p>
                  <p className="text-xs text-muted-foreground">João Santos - Apto 205 - 15:45</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Novo morador cadastrado</p>
                  <p className="text-xs text-muted-foreground">Ana Costa - Apto 304 - 13:20</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visitantes por Horário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: '08:00 - 12:00', count: 3, color: 'bg-primary' },
                { time: '12:00 - 16:00', count: 8, color: 'bg-success' },
                { time: '16:00 - 20:00', count: 5, color: 'bg-warning' },
                { time: '20:00 - 22:00', count: 1, color: 'bg-muted' },
              ].map((slot) => (
                <div key={slot.time} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{slot.time}</span>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-16 rounded-full ${slot.color}`}></div>
                    <span className="text-sm font-bold">{slot.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
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
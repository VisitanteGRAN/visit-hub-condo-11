import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Bell,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePendingUsersPolling } from '@/hooks/usePendingUsersPolling';
import NotificationSettings from '@/components/NotificationSettings';
import { useState } from 'react';

function MoradorDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      {/* Boas-vindas */}
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Gran Royalle, {user?.name}!</CardTitle>
          <CardDescription>
            Gerencie seus visitantes de forma fácil e segura
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Ação Principal */}
      <div className="max-w-md mx-auto">
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
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  // 🔔 POLLING PARA DASHBOARD ADMIN
  const { pendingUsers, lastCheck } = usePendingUsersPolling({
    intervalMs: 15000,
    enableNotifications: true
  });

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
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Painel do Administrador</CardTitle>
              <CardDescription>
                Gerencie cadastros de moradores
                {lastCheck && (
                  <div className="text-xs mt-1">
                    🔄 Última verificação: {lastCheck.toLocaleTimeString()}
                  </div>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Configurações
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Ação Principal Admin */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <Button asChild className="w-full h-24 flex-col text-lg relative">
            <Link to="/admin/approvals">
              <Users className="h-8 w-8 mb-2" />
              Gerenciar Cadastros Pendentes
              {pendingUsers.length > 0 && (
                <Badge className="absolute top-2 right-2 bg-red-500">
                  {pendingUsers.length}
                </Badge>
              )}
            </Link>
          </Button>
        </CardContent>
      </Card>
      
      {/* 🔔 CONFIGURAÇÕES DE NOTIFICAÇÃO */}
      {showNotificationSettings && (
        <NotificationSettings />
      )}
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

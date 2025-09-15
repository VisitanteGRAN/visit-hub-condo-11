import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Smartphone,
  Settings
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationSettingsProps {
  className?: string;
}

export default function NotificationSettings({ className }: NotificationSettingsProps) {
  const {
    permission,
    isSupported,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = useNotifications();

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Permitido
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Negado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const getSubscriptionBadge = () => {
    if (isSubscribed) {
      return (
        <Badge variant="default" className="bg-blue-500">
          <Bell className="h-3 w-3 mr-1" />
          Ativado
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <BellOff className="h-3 w-3 mr-1" />
        Desativado
      </Badge>
    );
  };

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Configure notificações para novos cadastros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Seu navegador não suporta notificações push. 
              Tente usar Chrome, Firefox ou Safari mais recentes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba notificações instantâneas sobre novos cadastros pendentes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Permissão do Navegador</div>
            {getPermissionBadge()}
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Status das Notificações</div>
            {getSubscriptionBadge()}
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-3">
          {permission !== 'granted' && (
            <Button
              onClick={requestPermission}
              className="w-full"
              variant="outline"
            >
              <Bell className="h-4 w-4 mr-2" />
              Solicitar Permissão
            </Button>
          )}

          {permission === 'granted' && !isSubscribed && (
            <Button
              onClick={subscribe}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Ativar Notificações
            </Button>
          )}

          {permission === 'granted' && isSubscribed && (
            <div className="space-y-2">
              <Button
                onClick={unsubscribe}
                variant="outline"
                className="w-full"
              >
                <BellOff className="h-4 w-4 mr-2" />
                Desativar Notificações
              </Button>
              
              <Button
                onClick={sendTestNotification}
                variant="secondary"
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Enviar Teste
              </Button>
            </div>
          )}
        </div>

        {/* Informações */}
        {permission === 'granted' && isSubscribed && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Perfeito! Você receberá notificações instantâneas quando novos moradores 
              se cadastrarem e precisarem de aprovação.
            </AlertDescription>
          </Alert>
        )}

        {permission === 'denied' && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Para receber notificações, você precisa permitir no seu navegador. 
              Clique no ícone de 🔒 na barra de endereços e permita notificações.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

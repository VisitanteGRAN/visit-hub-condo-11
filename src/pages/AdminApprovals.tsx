import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle, XCircle, Clock, Mail, Home, Phone, ArrowLeft, FileText, Bell, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rawSupabaseQuery, rawSupabaseInsert, rawSupabaseUpdate, rawSupabaseDelete } from '@/lib/supabase-raw';
import { usePendingUsersPolling } from '@/hooks/usePendingUsersPolling';
import NotificationSettings from '@/components/NotificationSettings';
import { logger } from '@/utils/secureLogger';

interface PendingUser {
  id: string;
  email: string;
  nome: string;
  unidade: string;
  telefone?: string;
  cpf?: string;
  foto?: string;
  created_at: string;
  status: string;
}

export default function AdminApprovals() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // 🔔 POLLING COM NOTIFICAÇÕES
  const {
    pendingUsers,
    isLoading,
    lastCheck,
    newUsersCount,
    refreshData,
    isPolling
  } = usePendingUsersPolling({
    intervalMs: 15000, // 15 segundos
    enableNotifications: true,
    onNewUsers: (newUsers) => {
      console.log('🆕 Novos usuários detectados:', newUsers.length);
      // Aqui poderia implementar lógica adicional
    }
  });

  const approveUser = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    
    try {
      console.log('🔄 Aprovando usuário:', userId);
      
      // Primeiro, verificar se o usuário existe usando cliente RAW
      let existingUser = null;
      try {
        existingUser = await rawSupabaseQuery('usuarios', {
          select: 'id,email,nome,ativo,status',
          eq: { id: userId },
          single: true
        });
        console.log('✅ RAW - Usuário encontrado:', existingUser);
      } catch (err) {
        console.error('❌ RAW - Usuário não encontrado:', err);
        toast.error('Usuário não encontrado');
        return;
      }
      
      // Usar cliente RAW para aprovar usuário
      try {
        const result = await rawSupabaseUpdate('usuarios', {
          ativo: true, 
          status: 'ativo' 
        }, { id: userId });

        console.log('✅ RAW - Usuário aprovado:', result);
      } catch (error) {
        console.error('❌ RAW - Erro ao aprovar usuário:', error);
        toast.error(`Erro ao aprovar usuário: ${error.message}`);
        return;
      }

      // Sucesso - usuário foi aprovado
      toast.success('Usuário aprovado com sucesso!');
      
      // Atualizar dados automaticamente
      refreshData();
      
    } catch (error) {
      console.error('❌ Erro geral:', error);
      toast.error('Erro ao processar aprovação');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const rejectUser = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    
    try {
      // Deletar usuário rejeitado usando cliente RAW
      await rawSupabaseDelete('usuarios', { id: userId });
      console.log('✅ RAW - Usuário rejeitado e removido:', userId);

      toast.success('Usuário rejeitado e removido');
      
      // Atualizar dados automaticamente
      refreshData();
      
    } catch (error) {
      console.error('❌ Erro geral:', error);
      toast.error('Erro ao processar rejeição');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando cadastros pendentes...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Botão Voltar */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Aprovação de Cadastros</h1>
            <p className="text-muted-foreground">
              Gerencie os cadastros de moradores pendentes
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notificações
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {pendingUsers.length} pendente{pendingUsers.length !== 1 ? 's' : ''}
            {newUsersCount > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                +{newUsersCount}
              </span>
            )}
          </Badge>
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum cadastro pendente</h3>
            <p className="text-muted-foreground mb-4">
              Todos os cadastros de moradores foram processados.
            </p>
            <div className="text-sm text-muted-foreground">
              🔔 O sistema está verificando automaticamente a cada 15 segundos
              {lastCheck && (
                <div className="mt-1">
                  Última verificação: {lastCheck.toLocaleTimeString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-yellow-100 flex items-center justify-center">
                      {user.foto ? (
                        <img
                          src={user.foto}
                          alt={`Foto de ${user.nome}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.nome}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Aguardando aprovação
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.unidade}</span>
                  </div>
                  
                  {user.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.telefone}</span>
                    </div>
                  )}
                  
                  {user.cpf && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.cpf}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => approveUser(user.id)}
                    disabled={processingIds.has(user.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {processingIds.has(user.id) ? 'Aprovando...' : 'Aprovar'}
                  </Button>
                  
                  <Button
                    onClick={() => rejectUser(user.id)}
                    disabled={processingIds.has(user.id)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {processingIds.has(user.id) ? 'Rejeitando...' : 'Rejeitar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* 🔔 CONFIGURAÇÕES DE NOTIFICAÇÃO */}
      {showNotificationSettings && (
        <NotificationSettings className="mt-6" />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle, XCircle, Clock, Mail, Home, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PendingUser {
  id: string;
  email: string;
  nome: string;
  unidade: string;
  telefone?: string;
  cpf?: string;
  created_at: string;
  status: string;
}

export default function AdminApprovals() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('status', 'pendente')
        .eq('perfil', 'morador')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar usuários pendentes:', error);
        toast.error('Erro ao carregar usuários pendentes');
        return;
      }

      setPendingUsers(data || []);
    } catch (error) {
      console.error('❌ Erro geral:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          ativo: true, 
          status: 'ativo' 
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao aprovar usuário:', error);
        toast.error('Erro ao aprovar usuário');
        return;
      }

      toast.success('Usuário aprovado com sucesso!');
      
      // Remover da lista
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
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
      // Deletar usuário rejeitado
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao rejeitar usuário:', error);
        toast.error('Erro ao rejeitar usuário');
        return;
      }

      toast.success('Usuário rejeitado e removido');
      
      // Remover da lista
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
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
        
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {pendingUsers.length} pendente{pendingUsers.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum cadastro pendente</h3>
            <p className="text-muted-foreground">
              Todos os cadastros de moradores foram processados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <User className="h-5 w-5 text-yellow-600" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface UsePendingUsersPollingReturn {
  pendingUsers: PendingUser[];
  isLoading: boolean;
  lastCheck: Date | null;
  newUsersCount: number;
  refreshData: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
}

interface UsePendingUsersPollingOptions {
  intervalMs?: number;
  onNewUsers?: (newUsers: PendingUser[]) => void;
  enableNotifications?: boolean;
}

export function usePendingUsersPolling(
  options: UsePendingUsersPollingOptions = {}
): UsePendingUsersPollingReturn {
  const {
    intervalMs = 15000, // 15 segundos
    onNewUsers,
    enableNotifications = true
  } = options;

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousUserIdsRef = useRef<Set<string>>(new Set());

  const loadPendingUsers = useCallback(async () => {
    try {
      console.log('🔄 Verificando usuários pendentes...');
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('status', 'pendente')
        .eq('perfil', 'morador')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar usuários pendentes:', error);
        return;
      }

      const currentUserIds = new Set(data?.map(user => user.id) || []);
      const previousUserIds = previousUserIdsRef.current;

      // Detectar novos usuários
      const newUsers = data?.filter(user => !previousUserIds.has(user.id)) || [];
      
      if (newUsers.length > 0 && previousUserIds.size > 0) {
        console.log('🆕 Novos usuários detectados:', newUsers.length);
        setNewUsersCount(prev => prev + newUsers.length);
        
        // Callback para novos usuários
        onNewUsers?.(newUsers);
        
        // Notificação local se habilitada
        if (enableNotifications && 'Notification' in window && Notification.permission === 'granted') {
          const userName = newUsers[0]?.nome || 'Usuário';
          const message = newUsers.length === 1 
            ? `${userName} solicitou cadastro`
            : `${newUsers.length} novos cadastros pendentes`;

          new Notification('Gran Royalle - Novo Cadastro', {
            body: message,
            icon: '/pwa-icon-192.png',
            badge: '/pwa-icon-192.png',
            tag: 'admin-notification',
            data: { url: '/admin/approvals' }
          });

          toast.success(`🔔 ${newUsers.length} novo(s) cadastro(s) pendente(s)!`);
        }
      }

      setPendingUsers(data || []);
      previousUserIdsRef.current = currentUserIds;
      setLastCheck(new Date());
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onNewUsers, enableNotifications]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await loadPendingUsers();
  }, [loadPendingUsers]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    console.log(`▶️ Iniciando polling a cada ${intervalMs}ms`);
    setIsPolling(true);
    
    // Primeira execução imediata
    loadPendingUsers();
    
    // Polling subsequente
    intervalRef.current = setInterval(loadPendingUsers, intervalMs);
  }, [loadPendingUsers, intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      console.log('⏹️ Parando polling');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start polling
  useEffect(() => {
    startPolling();
    return stopPolling;
  }, [startPolling, stopPolling]);

  return {
    pendingUsers,
    isLoading,
    lastCheck,
    newUsersCount,
    refreshData,
    startPolling,
    stopPolling,
    isPolling
  };
}

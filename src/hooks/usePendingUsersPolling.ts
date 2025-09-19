import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rawSupabaseQuery } from '@/lib/supabase-raw';
import { toast } from 'sonner';
import { logger } from '@/utils/secureLogger';

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
      logger.info('🔄 Verificando usuários pendentes...');
      
      // Usar cliente RAW para buscar usuários pendentes
      let data = null;
      let error = null;
      
      try {
        data = await rawSupabaseQuery('usuarios', {
          select: '*',
          eq: { status: 'pendente', perfil: 'morador' }
        });
        console.log('✅ RAW polling - Usuários pendentes:', data?.length || 0);
      } catch (err: any) {
        error = err;
        console.error('❌ RAW polling - Erro:', err);
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
        
        // 🔊 NOTIFICAÇÃO COM SOM (SEMPRE FUNCIONA SE TEM PERMISSÃO)
        if (enableNotifications && 'Notification' in window && Notification.permission === 'granted') {
          const userName = newUsers[0]?.nome || 'Usuário';
          const message = newUsers.length === 1 
            ? `${userName} solicitou cadastro`
            : `${newUsers.length} novos cadastros pendentes`;

          // 🔊 CRIAR NOTIFICATION COM SOM
          const notification = new Notification('Gran Royalle - Novo Cadastro', {
            body: message,
            icon: '/pwa-icon-192.png',
            badge: '/pwa-icon-192.png',
            tag: 'admin-notification',
            requireInteraction: true,
            silent: false, // 🔊 GARANTIR SOM
            vibrate: [200, 100, 200, 100, 200], // 📨 VIBRAÇÃO
            data: { url: '/admin/approvals' }
          });

          // 🔊 TENTAR REPRODUZIR SOM ADICIONAL NO NAVEGADOR
          try {
            // Criar beep sintético para navegadores
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 🎵 CONFIGURAÇÃO DO SOM
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Frequência mais alta
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
            logger.info('🔊 Som de notificação reproduzido');
          } catch (error) {
            logger.info('🔊 Som não disponível, usando notificação padrão');
          }

          // 🎉 TOAST COM SOM E AÇÃO
          toast.success(`🔔 ${newUsers.length} novo(s) cadastro(s) pendente(s)!`, {
            duration: 8000, // Mais tempo para ler
            action: {
              label: '👁️ Ver Agora',
              onClick: () => {
                // Focar na janela se possível
                if (window.focus) window.focus();
                window.location.href = '/admin/approvals';
              }
            }
          });
          
          logger.info(`🎉 Detectados ${newUsers.length} novos cadastros com notificação + som`);
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

    logger.info(`▶️ Iniciando polling a cada ${intervalMs}ms`);
    setIsPolling(true);
    
    // Primeira execução imediata
    loadPendingUsers();
    
    // Polling subsequente
    intervalRef.current = setInterval(loadPendingUsers, intervalMs);
  }, [loadPendingUsers, intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      logger.info('⏹️ Parando polling');
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

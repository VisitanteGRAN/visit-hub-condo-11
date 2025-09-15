import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  subscription: PushSubscription | null;
  isSubscribed: boolean;
}

interface UseNotificationsReturn extends NotificationState {
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSupported: false,
    subscription: null,
    isSubscribed: false
  });

  useEffect(() => {
    checkNotificationSupport();
    checkExistingSubscription();
  }, []);

  const checkNotificationSupport = () => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'denied'
    }));

    console.log('🔔 Suporte a notificações:', {
      isSupported,
      permission: isSupported ? Notification.permission : 'denied'
    });
  };

  const checkExistingSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        subscription,
        isSubscribed: !!subscription
      }));

      console.log('📱 Subscription existente:', !!subscription);
    } catch (error) {
      console.error('❌ Erro ao verificar subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast.error('Notificações não são suportadas neste navegador');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      setState(prev => ({
        ...prev,
        permission
      }));

      if (permission === 'granted') {
        toast.success('✅ Permissão para notificações concedida!');
        console.log('✅ Permissão para notificações concedida');
        return true;
      } else {
        toast.warning('⚠️ Permissão para notificações negada');
        console.log('❌ Permissão para notificações negada');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      toast.error('Erro ao solicitar permissão para notificações');
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!state.isSupported || state.permission !== 'granted') {
      console.log('❌ Não é possível se inscrever: suporte ou permissão');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID key será configurada depois (por enquanto null)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: null // Será configurado depois com VAPID key
      });

      setState(prev => ({
        ...prev,
        subscription,
        isSubscribed: true
      }));

      console.log('✅ Inscrito em push notifications:', subscription);
      toast.success('🔔 Notificações ativadas!');
      
      // Aqui poderia enviar subscription para o servidor
      // await sendSubscriptionToServer(subscription);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao se inscrever:', error);
      toast.error('Erro ao ativar notificações');
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!state.subscription) {
      return false;
    }

    try {
      await state.subscription.unsubscribe();
      
      setState(prev => ({
        ...prev,
        subscription: null,
        isSubscribed: false
      }));

      console.log('✅ Desinscrito de push notifications');
      toast.success('🔕 Notificações desativadas');
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao desinscrever:', error);
      toast.error('Erro ao desativar notificações');
      return false;
    }
  };

  const sendTestNotification = () => {
    if (state.permission !== 'granted') {
      toast.warning('Permissão para notificações necessária');
      return;
    }

    // Enviar notificação local para teste
    if ('Notification' in window) {
      new Notification('Gran Royalle - Teste', {
        body: 'Esta é uma notificação de teste do sistema!',
        icon: '/pwa-icon-192.png',
        badge: '/pwa-icon-192.png',
        tag: 'test-notification'
      });

      toast.success('📨 Notificação de teste enviada!');
    }
  };

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
}

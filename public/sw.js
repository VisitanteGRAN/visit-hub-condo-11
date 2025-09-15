const CACHE_NAME = 'gran-royalle-v3.3.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon-180x180.png',
  '/apple-touch-icon-152x152.png',
  '/apple-touch-icon-120x120.png',
  '/apple-touch-icon-solid-180x180.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Recursos em cache');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Erro ao fazer cache:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker ativado');
      self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia: Cache First para recursos estáticos
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      url.pathname.includes('/assets/') ||
      url.pathname.includes('/lovable-uploads/')) {
    
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('📦 Servindo do cache:', request.url);
            return response;
          }
          
          console.log('🌐 Buscando online:', request.url);
          return fetch(request).then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          });
        })
        .catch(() => {
          console.log('❌ Offline - não foi possível carregar:', request.url);
          // Retornar página offline personalizada se necessário
          if (request.destination === 'document') {
            return caches.match('/');
          }
        })
    );
    return;
  }

  // Estratégia: Network First para API calls e páginas
  if (url.hostname === 'rnpgtwughapxxvvckepd.supabase.co' || 
      request.destination === 'document') {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          console.log('🌐 API/Page online:', request.url);
          
          // Cache apenas respostas de sucesso para documentos
          if (request.destination === 'document' && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          
          return response;
        })
        .catch(() => {
          console.log('❌ Offline - tentando cache:', request.url);
          return caches.match(request)
            .then((response) => {
              if (response) {
                console.log('📦 Servindo do cache offline:', request.url);
                return response;
              }
              
              // Fallback para página principal se estiver offline
              if (request.destination === 'document') {
                return caches.match('/');
              }
              
              throw new Error('Recurso não encontrado offline');
            });
        })
    );
    return;
  }

  // Para outras requisições, tentar network primeiro
  event.respondWith(fetch(request));
});

// Lidar com mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Pulando espera...');
    self.skipWaiting();
  }
});

// 🔔 NOTIFICAÇÕES PUSH ADMIN
self.addEventListener('push', (event) => {
  console.log('📨 Push recebido:', event);
  
  let options = {
    body: 'Nova pendência de cadastro recebida!',
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    tag: 'admin-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200], // 📨 VIBRAÇÃO MAIS LONGA
    silent: false, // 🔊 GARANTIR QUE NÃO ESTÁ SILENCIOSO
    data: {
      url: '/admin/approvals',
      dateOfArrival: Date.now(),
      type: 'admin',
      sound: true // 🔊 INDICADOR DE SOM
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir Painel',
        icon: '/pwa-icon-192.png'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  // Parse dos dados se existirem
  if (event.data) {
    try {
      const data = event.data.json();
      options.title = data.title || 'Gran Royalle - Novo Cadastro';
      options.body = data.body || options.body;
      options.data = { ...options.data, ...data };
    } catch (e) {
      options.title = 'Gran Royalle - Novo Cadastro';
      options.body = event.data.text() || options.body;
    }
  } else {
    options.title = 'Gran Royalle - Novo Cadastro';
  }

  console.log('🔔 Mostrando notificação:', options.title);
  console.log('🔊 Configurando som da notificação');

  event.waitUntil(
    self.registration.showNotification(options.title, options)
      .then(() => {
        // 🔊 TENTAR REPRODUZIR SOM CUSTOMIZADO
        try {
          // Para navegadores que suportam, tentar reproduzir som customizado
          if ('AudioContext' in self || 'webkitAudioContext' in self) {
            console.log('🎵 Sistema de áudio disponível para notificações');
          }
        } catch (error) {
          console.log('🔊 Som padrão do sistema será usado');
        }
      })
  );
});

// 🖱️ LIDAR COM CLIQUES EM NOTIFICAÇÕES
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notificação clicada:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/admin/approvals';
  console.log('🌐 Abrindo URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('🔍 Clientes encontrados:', clientList.length);
        
        // Se já tem uma janela aberta, focar nela e navegar
        for (const client of clientList) {
          if (client.url.includes('granroyalle-visitantes') && 'focus' in client) {
            console.log('✅ Focando cliente existente');
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        
        // Se não tem janela aberta, abrir nova
        console.log('🆕 Abrindo nova janela');
        if (clients.openWindow) {
          return clients.openWindow(`${self.location.origin}${urlToOpen}`);
        }
      })
      .catch((error) => {
        console.error('❌ Erro ao abrir notificação:', error);
      })
  );
});

// 🔄 PUSH SUBSCRIPTION CHANGE
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Push subscription mudou:', event);
  
  event.waitUntil(
    // Reinscrever automaticamente
    self.registration.pushManager.subscribe({
      userVisibleOnly: true
    }).then((subscription) => {
      console.log('✅ Nova subscription criada:', subscription);
      // Aqui poderia enviar nova subscription para o servidor
      // return fetch('/api/notifications/subscribe', ...);
    }).catch((error) => {
      console.error('❌ Erro ao reinscrever:', error);
    })
  );
});

console.log('🚀 Service Worker Gran Royalle v3.2.0 carregado!');
console.log('🔔 Push Notifications Admin habilitadas!'); 
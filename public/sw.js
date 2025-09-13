const CACHE_NAME = 'gran-royalle-v1.8.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/visitantelogo.png',
  '/temp-working-logo.png',
  '/lovable-uploads/88120252-9c46-4bf9-a5c8-48a57400b8be.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-icon-57x57.png',
  '/apple-icon-60x60.png',
  '/apple-icon-72x72.png',
  '/apple-icon-76x76.png',
  '/apple-icon-114x114.png',
  '/apple-icon-120x120.png',
  '/apple-icon-144x144.png',
  '/apple-icon-152x152.png',
  '/apple-icon-180x180.png'
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

// Notificações push (para funcionalidade futura)
self.addEventListener('push', (event) => {
  console.log('📨 Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Gran Royalle',
    icon: '/visitantelogo.png',
    badge: '/visitantelogo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/visitantelogo.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/visitantelogo.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Gran Royalle', options)
  );
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 
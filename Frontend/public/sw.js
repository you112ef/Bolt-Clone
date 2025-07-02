// Service Worker for AI Agent Platform PWA
const CACHE_NAME = 'ai-agent-platform-v1.0.0';
const OFFLINE_CACHE = 'ai-agent-offline-v1';

// Resources to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add critical CSS and JS files after build
];

// AI model files to cache
const AI_MODEL_CACHE_URLS = [
  // Transformers.js models will be added dynamically
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('Service Worker: Setting up offline cache');
        return cache.addAll(['/offline.html']);
      })
    ])
  );
  
  // Force activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle AI API requests
  if (url.pathname.startsWith('/api/ai/')) {
    event.respondWith(handleAIAPIRequest(request));
    return;
  }
  
  // Handle AI model files
  if (url.href.includes('huggingface.co') || url.href.includes('transformers')) {
    event.respondWith(handleModelRequest(request));
    return;
  }
  
  // Handle static assets
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle AI API requests with network-first strategy
async function handleAIAPIRequest(request) {
  try {
    // Always try network first for AI requests
    const networkResponse = await fetch(request);
    
    // Cache successful responses for short term
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: AI API offline, trying cache');
    
    // Fallback to cache if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline AI response
    return new Response(JSON.stringify({
      error: 'AI service offline',
      message: 'الخدمة غير متاحة حاليا، يرجى المحاولة لاحقا',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle AI model requests with cache-first strategy
async function handleModelRequest(request) {
  try {
    // Check cache first for model files
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving model from cache');
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Model request failed');
    throw error;
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      
      // Don't cache API responses in static cache
      if (!request.url.includes('/api/')) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Static request failed, serving offline page');
    
    // Serve offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Background sync for AI requests (when online again)
self.addEventListener('sync', (event) => {
  if (event.tag === 'ai-request-retry') {
    event.waitUntil(retryFailedAIRequests());
  }
});

// Retry failed AI requests when back online
async function retryFailedAIRequests() {
  const requests = await getFailedRequests();
  
  for (const request of requests) {
    try {
      await fetch(request);
      removeFailedRequest(request);
    } catch (error) {
      console.log('Service Worker: Retry failed for request:', request.url);
    }
  }
}

// Push notifications for AI completion (if needed)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'ai_completion') {
      event.waitUntil(
        self.registration.showNotification('🤖 AI Agent Completed', {
          body: data.message || 'تم إكمال مهمة الذكاء الاصطناعي',
          icon: '/icons/icon-192.png',
          badge: '/icons/badge-72.png',
          tag: 'ai-completion'
        })
      );
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.tag === 'ai-completion') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Placeholder functions for failed request tracking
async function getFailedRequests() {
  // Implementation would use IndexedDB to store failed requests
  return [];
}

async function removeFailedRequest(request) {
  // Implementation would remove from IndexedDB
}

console.log('Service Worker: AI Agent Platform SW loaded');
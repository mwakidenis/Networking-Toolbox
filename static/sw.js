// Service Worker for IP Calculator App
// Provides comprehensive offline functionality with strategic caching

// Centralized logging function - set to false for production
const DEBUG = false;
function log(...args) {
  if (DEBUG) {
    console.log('[SW]', ...args);
  }
}
function warn(...args) {
  if (DEBUG) {
    console.warn('[SW]', ...args);
  }
}
function error(...args) {
  if (DEBUG) {
    console.error('[SW]', ...args);
  }
}

// Generate cache keys with version and date fallback
// Removed - using hardcoded cache version

const CACHE_VERSION = '0.2.5';
const CACHE_NAME = 'networking-toolbox-v0.2.5';
const STATIC_CACHE = `networking-toolbox-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `networking-toolbox-dynamic-v${CACHE_VERSION}`;

log('Using cache version:', CACHE_VERSION);

// Core assets that must be available offline
const CORE_ASSETS = [
  '/',
  '/offline',
  '/bookmarks',
  '/sitemap',
  '/about'
];


// Static assets that don't change often
const STATIC_ASSETS = [
  '/favicon.ico',
  '/favicon.png',
  '/favicon-32x32.png',
  '/banner.png',
  '/robots.txt'
];

// Only cache what users actually bookmark - no predefined tool routes needed
// API endpoints are not cached - they return offline errors when network fails

// Essential assets that MUST be pre-cached for the app to work
const ESSENTIAL_ASSETS = [
  '/',
  '/offline'
];

self.addEventListener('install', (event) => {
  log('SW', 'Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      log('SW', 'Caching essential assets for offline functionality');
      return cache.addAll(ESSENTIAL_ASSETS);
    }).then(() => {
      log('SW', 'Service worker installed, skipping waiting');
      return self.skipWaiting();
    }).catch(error => {
      error('SW', 'Failed to cache essential assets:', error);
      throw error;
    })
  );
});

self.addEventListener('activate', (event) => {
  log('SW', 'Activating service worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            log('SW', `Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      log('SW', 'Service worker activated, claiming clients');
      return self.clients.claim();
    }).catch(error => {
      error('SW', 'Failed to activate service worker:', error);
      throw error;
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Skip WebSocket upgrades
  if (request.headers.get('upgrade') === 'websocket') return;

  event.respondWith(handleRequest(request));
});

// Check if request is for a static asset
function isStaticAsset(pathname) {
  return STATIC_ASSETS.some(asset => pathname === asset) ||
         pathname.startsWith('/_app/') ||
         pathname.startsWith('/static/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.ico') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.woff');
}

// Check if request is for an API endpoint
function isApiRequest(pathname) {
  return pathname.startsWith('/api/') || pathname === '/health' || pathname === '/version';
}

// Removed isToolRoute function - we only cache bookmarked tools on demand

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Return cached version and update in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Network failed, but we have cached version
    });
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    log(' Static asset fetch failed:', request.url);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle API requests - no caching, return offline errors when needed
async function handleApiRequest(request) {
  try {
    // Always try network first, no caching
    const response = await fetch(request);
    return response;
  } catch (error) {
    log(' API request failed, returning offline error:', request.url);

    // Network failed, return offline error
    return new Response(
      JSON.stringify({
        error: 'You are offline.',
        offline: true,
        message: 'This tool requires internet connectivity'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Removed handleToolRoute function - tools are cached via handlePageRequest when bookmarked

// Handle general page requests
async function handlePageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);

  // Special handling for offline page to prevent 500 errors
  if (url.pathname === '/offline') {
    // Try current version cache first
    let cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // If not in current cache, try all caches (version fallback)
    const allCaches = await caches.keys();
    for (const cacheName of allCaches) {
      if (cacheName.startsWith('networking-toolbox-v')) {
        const oldCache = await caches.open(cacheName);
        cached = await oldCache.match(request);
        if (cached) {
          // Copy to current cache for future use
          cache.put(request, cached.clone());
          return cached;
        }
      }
    }

    // If not cached anywhere, try to fetch and cache it
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
        return response;
      }
    } catch (error) {
      error(' Failed to fetch offline page:', error);
    }

    // Last resort: return a basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Offline - Networking Toolbox</title></head>
      <body>
        <h1>You're Offline</h1>
        <p>Your bookmarked tools are still available.</p>
        <a href="/">Go to Homepage</a>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache the response - this will work great with cache headers you'll add later
      cache.put(request, response.clone());
      return response;
    } else if (response.status >= 500) {
      // Server error - don't return this, try cache instead
      log(' Server error (', response.status, '), trying cache for:', request.url);
      throw new Error(`Server error: ${response.status}`);
    } else {
      // 4xx errors (like 404) - return as is
      return response;
    }
  } catch (error) {
    log(' Page request failed, trying cache:', request.url);

    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // Fallback to offline page or main page
    const offlinePage = await cache.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }

    const mainPage = await cache.match('/');
    if (mainPage) {
      return mainPage;
    }

    // Always return a proper HTML offline page, never a 503 error
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Offline - IP Calculator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; max-width: 600px; margin: 0 auto; }
          h1 { color: #e74c3c; margin-bottom: 1rem; }
          p { color: #666; line-height: 1.6; margin-bottom: 2rem; }
          a { background: #3498db; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; display: inline-block; }
          a:hover { background: #2980b9; }
        </style>
      </head>
      <body>
        <h1>You're Offline</h1>
        <p>This page isn't available offline. Your bookmarked tools and recently visited pages are still accessible.</p>
        <a href="/">Go to Homepage</a>
        <a href="/offline" style="margin-left: 1rem;">View Offline Tools</a>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle background sync for bookmarks and preferences
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-bookmarks') {
    event.waitUntil(syncBookmarks());
  }
});

// Handle push notifications for updates
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/favicon-32x32.png',
        badge: '/favicon.png',
        tag: 'update-notification'
      })
    );
  }
});

// Sync bookmarks when back online
async function syncBookmarks() {
  try {
    // Get bookmarks from localStorage via client
    const clients = await self.clients.matchAll();

    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_BOOKMARKS',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    log(' Failed to sync bookmarks:', error);
  }
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // For critical JavaScript files - use cache-first strategy
  if (pathname.endsWith('.js') || pathname.startsWith('/_app/')) {
    return handleCriticalAsset(request);
  }

  // For CSS files - use cache-first strategy
  if (pathname.endsWith('.css')) {
    return handleCriticalAsset(request);
  }

  // For API requests - always network first, no caching
  if (pathname.startsWith('/api/') || pathname.startsWith('/version')) {
    return handleApiRequest(request);
  }

  // For SvelteKit data requests - handle specially
  if (pathname.includes('__data.json')) {
    return handleDataRequest(request);
  }

  // For all other requests - network first with fallback
  return handlePageRequest(request);
}

// Critical assets (JS, CSS) must be cached aggressively - cache first strategy
async function handleCriticalAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    log('Serving critical asset from cache:', request.url);
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Network failed, but we have cached version
    });
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      log('Cached critical asset:', request.url);
    }
    return response;
  } catch (error) {
    log('ERROR: Critical asset not available:', request.url);

    // For JS files, return empty function to prevent errors
    if (request.url.endsWith('.js')) {
      return new Response('console.warn("Offline: Script not available:", "' + request.url + '");', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript' }
      });
    }

    // For CSS files, return empty styles
    return new Response('/* Offline: CSS not available */', {
      status: 200,
      headers: { 'Content-Type': 'text/css' }
    });
  }
}

// Handle SvelteKit data requests
async function handleDataRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Check cache first
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // Return minimal valid SvelteKit data
    return new Response('{"type":"data","nodes":[{"type":"data","data":null,"uses":{}}]}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function isToolRoute(pathname) {
  // Basic tool route detection
  return pathname.startsWith('/calculators/') || 
         pathname.startsWith('/converters/') || 
         pathname.startsWith('/content/') ||
         pathname.startsWith('/subnetting/') ||
         pathname.startsWith('/reference/');
}

// Pre-cache bookmarked tools when user adds them
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_BOOKMARK') {
    const url = event.data.url;
    cacheBookmarkIfNeeded(url);
  }

  // Handle request to cache all bookmarks
  if (event.data && event.data.type === 'CACHE_ALL_BOOKMARKS') {
    const bookmarks = event.data.bookmarks;
    cacheBookmarksIfNeeded(bookmarks);
  }
});

// Cache a single bookmark only if not already cached
async function cacheBookmarkIfNeeded(url) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);

    if (cached) {
      log('Bookmark already cached:', url);
      return;
    }

    log('Caching new bookmark:', url);
    const response = await fetch(url);

    if (response.ok) {
      await cache.put(url, response);
      log('Successfully cached bookmark:', url);
    } else {
      log('Failed to fetch bookmark (status:', response.status, '):', url);
    }
  } catch (error) {
    log('Failed to cache bookmark:', url, error);
  }
}

// Cache multiple bookmarks with rate limiting
async function cacheBookmarksIfNeeded(bookmarks) {
  if (!bookmarks || bookmarks.length === 0) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  let cachedCount = 0;
  let newlyCached = 0;

  log('Checking', bookmarks.length, 'bookmarks for caching...');

  // Check which bookmarks need caching (limit to prevent infinite loops)
  for (const bookmark of bookmarks.slice(0, 10)) { // Limit to 10 to prevent runaway
    try {
      const cached = await cache.match(bookmark.href);
      if (!cached) {
        log('Caching bookmark:', bookmark.href);
        const response = await fetch(bookmark.href);
        if (response.ok) {
          await cache.put(bookmark.href, response);
          newlyCached++;
        }
      } else {
        cachedCount++;
      }
    } catch (error) {
      log('Error caching bookmark:', bookmark.href, error);
    }
  }

  log('Bookmark caching complete:', cachedCount, 'already cached,', newlyCached, 'newly cached');
}

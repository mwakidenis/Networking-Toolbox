import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { SUB_NAV } from '$lib/constants/nav';

// Centralized logging - set to false for production
const DEBUG = false;
function log(module: string, ...args: any[]) {
  if (DEBUG) {
    console.log(`[${module}]`, ...args);
  }
}

// Online/offline status
export const isOnline = writable(true);

// Service worker registration status
export const serviceWorkerRegistered = writable(false);

// Offline capabilities
export const offlineCapabilities = writable({
  cacheEnabled: false,
  backgroundSync: false,
  pushNotifications: false,
});

// Initialize offline functionality
export function initializeOfflineSupport() {
  if (!browser) return;

  // Set initial online status
  isOnline.set(navigator.onLine);

  // Listen for online/offline events
  const handleOnline = () => {
    isOnline.set(true);
    log('Offline', ' Back online');

    // Trigger background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready
        .then((registration) => {
          // Cast to any to work around TypeScript sync API limitations
          return (registration as any).sync.register('background-sync-bookmarks');
        })
        .catch((err) => {
          log('Offline', ' Background sync failed:', err);
        });
    }
  };

  const handleOffline = () => {
    isOnline.set(false);
    log('Offline', ' Gone offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Register service worker
  registerServiceWorker();

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Register service worker
async function registerServiceWorker() {
  if (!browser || !('serviceWorker' in navigator)) {
    log('SW', ' Service worker not supported');
    return;
  }

  // Note: Service worker will be registered in dev mode but configured to skip Vite requests
  // This allows offline testing while preserving HMR functionality

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    serviceWorkerRegistered.set(true);
    log('SW', ' Service worker registered successfully');

    // Update capabilities based on what's available
    offlineCapabilities.set({
      cacheEnabled: true,
      backgroundSync: 'sync' in (registration as any),
      pushNotifications: 'showNotification' in registration,
    });

    // Listen for service worker updates
    registration.addEventListener('updatefound', () => {
      log('SW', ' Service worker update found');
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            log('SW', ' New service worker installed, ready to update');
            // Could show update notification here
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type } = event.data;

      switch (type) {
        case 'SYNC_BOOKMARKS':
          log('SW', ' Bookmark sync requested');
          // Trigger bookmark synchronization
          syncBookmarksData();
          break;

        default:
          log('SW', ' Unknown message type:', type);
      }
    });
  } catch (error) {
    log('SW', 'Service worker registration failed:', error);
    serviceWorkerRegistered.set(false);
  }
}

// Cache a bookmarked tool
export function cacheBookmark(url: string) {
  if (!browser || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready
    .then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'CACHE_BOOKMARK',
          url: url,
        });
      }
    })
    .catch((error) => {
      log('SW', ' Failed to cache bookmark:', error);
    });
}

// Cache all bookmarks at once
export function cacheAllBookmarks(bookmarks: any[]) {
  if (!browser || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready
    .then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'CACHE_ALL_BOOKMARKS',
          bookmarks: bookmarks,
        });
      }
    })
    .catch((error) => {
      log('SW', ' Failed to cache all bookmarks:', error);
    });
}

// Sync bookmarks data (called by service worker)
function syncBookmarksData() {
  // This would typically sync with a server
  // For now, just log that sync was requested
  log('Offline', ' Bookmarks sync completed');
}

// Check if a URL is likely to work offline
export function isOfflineCapable(url: string): boolean {
  // Only diagnostic tools require internet connectivity
  return !url.includes('/diagnostics/');
}

// Extract all tool routes from navigation data
function getAllToolRoutes(): string[] {
  const toolRoutes: string[] = [];

  // Iterate through all sections in SUB_NAV
  Object.values(SUB_NAV).forEach((sectionItems) => {
    sectionItems.forEach((item) => {
      if ('href' in item && item.href) {
        // Extract the route pattern from the href
        const pathParts = item.href.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
          const routePattern = `/${pathParts[0]}/`;
          if (!toolRoutes.includes(routePattern)) {
            toolRoutes.push(routePattern);
          }
        }
      } else if ('items' in item && item.items) {
        // Handle NavGroup - extract routes from nested items
        item.items.forEach((subItem) => {
          if (subItem.href) {
            const pathParts = subItem.href.split('/').filter(Boolean);
            if (pathParts.length >= 2) {
              const routePattern = `/${pathParts[0]}/`;
              if (!toolRoutes.includes(routePattern)) {
                toolRoutes.push(routePattern);
              }
            }
          }
        });
      }
    });
  });

  return toolRoutes;
}

// Check if a URL is an actual downloadable tool (not just a regular page)
export function isDownloadableTool(url: string): boolean {
  const toolRoutes = getAllToolRoutes();
  return toolRoutes.some((route) => url.includes(route));
}

// Derived store for offline-ready status
export const offlineReady = derived(
  [serviceWorkerRegistered, offlineCapabilities],
  ([$registered, $capabilities]) => $registered && $capabilities.cacheEnabled,
);

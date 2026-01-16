/**
 * Service Worker Registration
 * Registers the service worker for offline support and PWA features
 */

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('[SW] Service Worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, prompt user to update
                  if (confirm('A new version is available. Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      // Handle controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] New service worker activated');
      });
    });
  } else {
    console.log('[SW] Service Workers are not supported in this browser');
  }
}

export function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready
      .then(registration => {
        return registration.unregister();
      })
      .catch(error => {
        console.error('[SW] Service Worker unregistration failed:', error);
        return false;
      });
  }
  return Promise.resolve(false);
}

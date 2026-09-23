/**
 * LightSafe Service Worker
 * ------------------------
 * Cache-first for static assets (app shell).
 * Network-first passthrough for Firestore/API calls (handled by Firebase SDK).
 * This keeps the app loadable offline while Firestore handles its own persistence.
 */

const CACHE_NAME = 'lightsafe-v1';

// App shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Ignore individual cache failures — assets may not exist yet
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static assets, network-first for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always use network for Firestore, Firebase Auth, and external APIs
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('openstreetmap.org')
  ) {
    // Network-only — let Firebase SDK handle caching/persistence
    return;
  }

  // Cache-first for same-origin static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          // Cache successful GET responses
          if (
            response.ok &&
            event.request.method === 'GET' &&
            !event.request.url.includes('sockjs')
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});

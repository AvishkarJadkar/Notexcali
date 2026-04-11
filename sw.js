const CACHE_NAME = 'notexcali-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './sidebar.js',
  './components/editor.js',
  './components/canvas.js',
  './components/menu.js',
  './components/search.js',
  './components/emoji-picker.js',
  './utils/firebase.js',
  './utils/auth.js',
  './utils/db.js',
  './utils/state.js',
  './utils/helpers.js',
  './utils/confirm.js',
  './utils/toast.js'
];

// Firebase API domains that must NEVER be cached
const FIREBASE_DOMAINS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'www.googleapis.com',
  'accounts.google.com'
];

// Install — cache core app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // NEVER cache Firebase API calls — they must always go to the network
  if (FIREBASE_DOMAINS.some(domain => url.hostname.includes(domain))) {
    return; // Let the browser handle it normally
  }

  // For CDN resources (fonts, libraries, Firebase SDK), use cache-first
  if (url.origin !== location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        return cached || fetch(e.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // For local files, use network-first (so updates are always fresh)
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

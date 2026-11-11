// Offline: every file the app needs is saved on the phone at the first visit.
// After that, pages open from the saved copy at once, and a fresh copy is fetched in
// the background for next time. So an update shows up the second time the app is opened.
const CACHE = 'civics128-v1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/data.js', 'js/store.js', 'js/srs.js', 'js/speak.js', 'js/ui.js',
  'js/home.js', 'js/place.js', 'js/study.js', 'js/drill.js',
  'data/questions.json', 'data/es.json', 'data/officials.json',
  'assets/images/mall-day.webp', 'assets/images/mall-night.webp', 'assets/images/eagle-officer.webp',
  'assets/fonts/fraunces.woff2', 'assets/fonts/fraunces-italic.woff2', 'assets/fonts/nunito.woff2',
  'assets/icons/icon-180.png', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const saved = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => saved);
    if (saved) { e.waitUntil(fresh); return saved; }
    return fresh;
  }));
});

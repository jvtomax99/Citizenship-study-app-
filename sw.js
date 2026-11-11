// Offline: every file the app needs is saved on the phone at the first visit, and the
// app always opens from that saved copy. Each time it is opened with internet, a whole
// fresh set is downloaded in the background and swapped in only if every file arrived,
// so the files never get mixed between two versions. An update shows up the second
// time the app is opened. A new file the app needs must be added to FILES.
const CACHE = 'civics128-v2';
const NEXT = 'civics128-next';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/data.js', 'js/store.js', 'js/srs.js', 'js/speak.js', 'js/ui.js',
  'js/home.js', 'js/place.js', 'js/study.js', 'js/drill.js', 'js/mock.js', 'js/match.js', 'js/listen.js',
  'data/questions.json', 'data/es.json', 'data/officials.json',
  'assets/images/mall-day.webp', 'assets/images/mall-night.webp', 'assets/images/eagle-officer.webp',
  'assets/fonts/fraunces.woff2', 'assets/fonts/fraunces-italic.woff2', 'assets/fonts/nunito.woff2',
  'assets/icons/icon-180.png', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
];
const fresh = () => FILES.map((f) => new Request(f, { cache: 'no-cache' }));

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(fresh())).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

let refreshing = null;
function refreshAll() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    await caches.delete(NEXT);
    const next = await caches.open(NEXT);
    await next.addAll(fresh()); // fails as a whole if any file fails: nothing is swapped
    const live = await caches.open(CACHE);
    for (const req of await next.keys()) await live.put(req, await next.match(req));
    await caches.delete(NEXT);
  })().catch(() => {}).finally(() => { refreshing = null; });
  return refreshing;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const saved = await cache.match(req, { ignoreSearch: true });
    if (req.mode === 'navigate') e.waitUntil(refreshAll());
    return saved || fetch(req).catch(() => Response.error());
  }));
});

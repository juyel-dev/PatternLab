const CACHE_NAME = 'patternlab-v1';
const urlsToCache = [
  '/patternlab/',
  '/patternlab/index.html',
  '/patternlab/style.css',
  '/patternlab/app.js',
  '/patternlab/engine/validator.js',
  '/patternlab/engine/generator.js',
  '/patternlab/engine/strength.js',
  '/patternlab/engine/heatmap.js',
  '/patternlab/ui/grid.js',
  '/patternlab/ui/canvas.js',
  '/patternlab/worker/generatorWorker.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

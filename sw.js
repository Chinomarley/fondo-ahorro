
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open("fondo-ahorro-cache").then(function(cache) {
      return cache.addAll([
        "index.html",
        "fondo_ahorro_completo.html",
        "manifest.json",
        "icon-512.png"
      ]);
    })
  );
});
self.addEventListener("fetch", function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});

const CACHE = "clubplus-v2";
const ASSETS = [
  "/club-plus/",
  "/club-plus/index.html",
  "/club-plus/manifest.json",
  "/club-plus/icon-192.png",
  "/club-plus/icon-512.png"
];

// Installation : mise en cache des ressources de base
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : network first, fallback cache
self.addEventListener("fetch", e => {
  // Ne pas intercepter les requêtes Supabase
  if (e.request.url.includes("supabase.co")) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Mettre en cache la réponse fraîche
        if (res && res.status === 200 && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Notifications push
self.addEventListener("push", e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || "Club+", {
      body: data.body || "Nouvelle offre disponible !",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" }
    })
  );
});

// Clic sur notification → ouvre l'app
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(list => {
      for (const c of list) {
        if (c.url === "/" && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(e.notification.data?.url || "/");
    })
  );
});

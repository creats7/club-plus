const CACHE = "clubplus-v4";
const ASSETS = [
  "/club-plus/",
  "/club-plus/index.html",
  "/club-plus/manifest.json",
  "/club-plus/icon-192.png",
  "/club-plus/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = e.request.url;

  // Laisser passer TOUT ce qui contient un hash auth
  if (url.includes("access_token") || url.includes("type=magiclink") || url.includes("type=recovery")) return;

  if (url.includes("supabase.co") || url.includes("/rest/") ||
      url.includes("googleapis") || url.includes("cdnjs") ||
      url.includes("jsdelivr") || e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

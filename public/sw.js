// Service worker básico: cachea el shell para que la app sea instalable y
// arranque offline. NO intercepta Firebase/Firestore (siempre en vivo).
//
// Al cambiar el shell, subí la versión de SHELL_CACHE: el activate borra los
// caches viejos, así los assets hasheados de builds anteriores no se acumulan.
const SHELL_CACHE = "pandalink-shell-v2";
const RUNTIME_CACHE = "pandalink-runtime-v1";
const MAX_RUNTIME = 60; // tope de estáticos cacheados en runtime (kiosco encendido meses)

const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/Logo Panda Store.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = [SHELL_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Mantiene el runtime acotado: borra las entradas más viejas al pasar el tope.
async function trimRuntime() {
  const cache = await caches.open(RUNTIME_CACHE);
  const keys = await cache.keys();
  if (keys.length <= MAX_RUNTIME) return;
  await Promise.all(keys.slice(0, keys.length - MAX_RUNTIME).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Solo manejamos mismo-origen; Firebase y otras APIs pasan directo a la red.
  if (url.origin !== self.location.origin) return;

  // Navegaciones: red primero, con fallback al shell cacheado (offline).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html").then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Estáticos del mismo origen: cache primero, guardando lo nuevo en runtime.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((resp) => {
            const copy = resp.clone();
            caches
              .open(RUNTIME_CACHE)
              .then((c) => c.put(req, copy))
              .then(trimRuntime);
            return resp;
          })
          .catch(() => cached),
    ),
  );
});

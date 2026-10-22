// Service worker de Diablos Stuff+ (vite-plugin-pwa, estrategia injectManifest; sin librerías de Workbox).
// - El "shell" de la app (HTML, JS, CSS, íconos) se guarda al instalar: abre sin conexión.
// - /api/*: primero la red; si no hay red, la última respuesta guardada, marcada con x-from-cache
//   para que la app diga "Sin conexión · datos de hace …".
// - Fuentes de Google: se guardan la primera vez que se usan.

const SHELL = "shell-v2";
const API = "api-v1";
const FONTS = "fonts-v1";
// Sin duplicados: el plugin agrega los íconos del manifest y el patrón también los incluye (addAll falla con repetidos).
const manifest = [...new Set(self.__WB_MANIFEST.map((e) => new URL(e.url, self.registration.scope).href))];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(manifest)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, API, FONTS]);
    for (const k of await caches.keys()) if (!keep.has(k)) await caches.delete(k);
    // Quita del shell lo que ya no está en el build nuevo.
    const shell = await caches.open(SHELL);
    for (const req of await shell.keys()) if (!manifest.includes(req.url)) await shell.delete(req);
    await self.clients.claim();
  })());
});

async function apiNetworkFirst(request) {
  const cache = await caches.open(API);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request, { ignoreVary: true });
    if (!cached) throw new Error("offline");
    const headers = new Headers(cached.headers);
    headers.set("x-from-cache", "1");
    return new Response(await cached.blob(), { status: cached.status, statusText: cached.statusText, headers });
  }
}

// ignoreVary: el JS y el CSS se piden con crossorigin (llevan Origin) y el servidor responde con
// "Vary: Origin"; sin esto la copia guardada al instalar no coincide y la app no abre sin red.
async function shellFirst(request) {
  const hit = await caches.match(request, { ignoreVary: true });
  return hit ?? fetch(request);
}

async function navigation(request) {
  try {
    return await fetch(request);
  } catch {
    const index = manifest.find((u) => u.endsWith("/index.html"));
    return (index && (await caches.match(index, { ignoreVary: true }))) ?? Response.error();
  }
}

async function fontsCacheFirst(request) {
  const cache = await caches.open(FONTS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === "opaque") cache.put(request, res.clone());
  return res;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) event.respondWith(apiNetworkFirst(request));
  else if (request.mode === "navigate") event.respondWith(navigation(request));
  else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") event.respondWith(fontsCacheFirst(request));
  else if (url.origin === self.location.origin) event.respondWith(shellFirst(request));
});

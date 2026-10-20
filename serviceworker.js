const CACHE_NAME = "Pokedex-PWA";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./CSS/style.css",
    "./js/app.js",
    "./manifest.json",
    "./images/icons/icon-72x72.png",
    "./images/icons/icon-96x96.png",
    "./images/icons/icon-128x128.png",
    "./images/icons/icon-144x144.png",
    "./images/icons/icon-152x152.png",
    "./images/icons/icon-192x192.png",
    "./images/icons/icon-512x512.png",
];

// Instalación: guardar los recursos disponibles
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                await Promise.all(
                    ARCHIVOS.map(async archivo => {
                        try {
                            const respuesta = await fetch(archivo);

                            if (respuesta.ok) {
                                await cache.put(archivo, respuesta);
                            } else {
                                console.warn(
                                    "No se pudo guardar:",
                                    archivo,
                                    respuesta.status
                                );
                            }
                        } catch (error) {
                            console.warn(
                                "Error al cargar:",
                                archivo,
                                error
                            );
                        }
                    })
                );
            })
            .then(() => self.skipWaiting())
    );
});

// Activación: eliminar cachés anteriores
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

// Cache First: primero buscar en caché
async function cacheFirst(request) {
    const respuestaCache = await caches.match(request);

    if (respuestaCache) {
        return respuestaCache;
    }

    try {
        const respuestaRed = await fetch(request);

        if (respuestaRed.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, respuestaRed.clone());
        }

        return respuestaRed;
    } catch (error) {
        return new Response("Recurso no disponible sin conexión.", {
            status: 503,
            statusText: "Service Unavailable"
        });
    }
}

// Network First: primero consultar la red
async function networkFirst(request) {
    try {
        const respuestaRed = await fetch(request);

        if (respuestaRed.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, respuestaRed.clone());
        }

        return respuestaRed;
    } catch (error) {
        const respuestaCache = await caches.match(request);

        if (respuestaCache) {
            return respuestaCache;
        }

        return new Response(
            "Página no disponible sin conexión.",
            {
                status: 503,
                statusText: "Service Unavailable"
            }
        );
    }
}

// Selección de estrategia
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") {
        return;
    }

    const url = new URL(event.request.url);

    // Ignorar solicitudes externas
    if (url.origin !== self.location.origin) {
        return;
    }

    // Network First para páginas
    if (
        event.request.mode === "navigate" ||
        url.pathname.endsWith(".html")
    ) {
        event.respondWith(networkFirst(event.request));
    } else {
        // Cache First para CSS, JS, imágenes y otros recursos
        event.respondWith(cacheFirst(event.request));
    }
});

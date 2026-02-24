/**
 * rBiblia Web - Service Worker
 *
 * Strategy:
 *   - Static assets (CSS, JS, fonts, icons): Cache-first (fast loads)
 *   - API requests: Network-first with cache fallback (fresh data when online, cached when offline)
 *   - HTML pages: Network-first (always serve latest version)
 *   - Images: Cache-first with network fallback
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `rbiblia-static-${CACHE_VERSION}`;
const API_CACHE = `rbiblia-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `rbiblia-images-${CACHE_VERSION}`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
    "/",
    "/assets/app.css",
    "/assets/app.js",
    "/assets/favicon.png",
    "/assets/icon_128x128.png",
    "/assets/icon_192x192.png",
    "/assets/icon_512x512.png",
    "/assets/icons/sprite.svg",
];

// Max items in API cache
const API_CACHE_MAX_ITEMS = 200;

// ──────────────────────────────────────
// Install – pre-cache essential assets
// ──────────────────────────────────────
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => {
                // Use addAll with individual catching so one failure
                // doesn't prevent the rest from caching
                return Promise.allSettled(
                    PRECACHE_ASSETS.map((url) =>
                        cache.add(url).catch((err) => {
                            console.warn(`[SW] Failed to pre-cache: ${url}`, err);
                        })
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

// ──────────────────────────────────────
// Activate – clean old caches
// ──────────────────────────────────────
self.addEventListener("activate", (event) => {
    const currentCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((name) => !currentCaches.includes(name))
                        .map((name) => caches.delete(name))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ──────────────────────────────────────
// Fetch – routing strategies
// ──────────────────────────────────────
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) return;

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // API requests → Network-first
    if (url.pathname.startsWith("/api/")) {
        event.respondWith(networkFirst(request, API_CACHE));
        return;
    }

    // Static assets → Cache-first
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // Images → Cache-first
    if (isImage(url.pathname)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }

    // HTML pages → Network-first
    event.respondWith(networkFirst(request, STATIC_CACHE));
});

// ──────────────────────────────────────
// Strategies
// ──────────────────────────────────────

/**
 * Cache-first: Return cached version, fall back to network.
 * Updates cache in the background when network succeeds.
 */
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        // Revalidate in background (stale-while-revalidate)
        fetchAndCache(request, cache).catch(() => { });
        return cached;
    }

    return fetchAndCache(request, cache);
}

/**
 * Network-first: Try network, fall back to cache.
 */
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request);

        // Cache successful responses
        if (response.ok) {
            // Clone before caching (response can only be consumed once)
            cache.put(request, response.clone());

            // Trim API cache if needed
            if (cacheName === API_CACHE) {
                trimCache(cache, API_CACHE_MAX_ITEMS);
            }
        }

        return response;
    } catch (error) {
        // Network failed – try cache
        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        // If it's a navigation request, return the cached root page (SPA fallback)
        if (request.mode === "navigate") {
            const fallback = await cache.match("/");
            if (fallback) return fallback;
        }

        // Nothing in cache either – return offline response
        return new Response("Offline – brak połączenia z internetem", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }
}

/**
 * Fetch and update cache
 */
async function fetchAndCache(request, cache) {
    const response = await fetch(request);
    if (response.ok) {
        cache.put(request, response.clone());
    }
    return response;
}

/**
 * Trim cache to max items (remove oldest entries)
 */
async function trimCache(cache, maxItems) {
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        // Delete the oldest entries (first in list)
        const deleteCount = keys.length - maxItems;
        await Promise.all(
            keys.slice(0, deleteCount).map((key) => cache.delete(key))
        );
    }
}

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

function isStaticAsset(pathname) {
    return /\.(css|js|woff2?|json|svg)(\?.*)?$/i.test(pathname);
}

function isImage(pathname) {
    return /\.(png|jpe?g|gif|webp|ico)(\?.*)?$/i.test(pathname);
}

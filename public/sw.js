const CACHE_NAME = "northstar-shell-v3";
const APP_SHELL = ["/", "/offline", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

    if (request.mode === "navigate") {
        event.respondWith(fetch(request).catch(() => caches.match("/offline")));
        return;
    }

    if (url.pathname.startsWith("/_next/static/") || /\.(?:css|js|svg|png|webp|woff2?)$/.test(url.pathname)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const network = fetch(request).then((response) => {
                    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
                    return response;
                });
                return cached || network;
            }),
        );
    }
});

self.addEventListener("push", (event) => {
    let payload = { title: "Northstar", body: "A small action is ready when you are.", url: "/dashboard" };
    try { payload = { ...payload, ...event.data.json() }; } catch {}
    event.waitUntil(self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: "northstar-reminder",
        data: { url: payload.url },
    }));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const destination = event.notification.data?.url || "/dashboard";
    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
            if (existing) { existing.navigate(destination); return existing.focus(); }
            return self.clients.openWindow(destination);
        }),
    );
});

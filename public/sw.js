/* Service worker Blush: tampilkan notifikasi dan buka halaman yang dituju. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Blush", body: "Ada kabar baru untukmu." };
  }
  const title = data.title || "Blush";
  const options = {
    body: data.body || "Buka Blush untuk melihat.",
    icon: "/notif-icon.png",
    badge: "/notif-icon.png",
    tag: data.tag || "blush",
    data: { url: data.url || "/app/discover" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let url = "/app/discover";
  try {
    const target = new URL(event.notification.data?.url || "/app/discover", self.location.origin);
    url = target.origin === self.location.origin ? target.pathname + target.search : "/app/discover";
  } catch {
    url = "/app/discover";
  }
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const win of windows) {
        if ("focus" in win && win.url.includes(new URL(url, self.location.origin).pathname)) {
          return win.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});

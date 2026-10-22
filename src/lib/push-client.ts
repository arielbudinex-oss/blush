const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && Boolean(PUBLIC_KEY);
}

function keyBytes() {
  if (!PUBLIC_KEY) throw new Error("Kunci notifikasi belum tersedia.");
  const padding = "=".repeat((4 - (PUBLIC_KEY.length % 4)) % 4);
  const raw = atob((PUBLIC_KEY + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function save(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  if (!res.ok) throw new Error("Langganan notifikasi belum tersimpan.");
}

/** Daftarkan perangkat. Dipanggil hanya dari klik user. */
export async function subscribeToPush() {
  if (!pushSupported()) throw new Error("Browser ini belum mendukung notifikasi aplikasi.");
  if (Notification.permission !== "granted") throw new Error("Izin notifikasi belum diberikan.");

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  // Langsung minta langganan; lebih cepat daripada menunggu getSubscription di sebagian browser.
  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(),
    });
  } catch {
    const existing = await registration.pushManager.getSubscription();
    if (!existing) throw new Error("Perangkat belum bisa mendaftar untuk notifikasi.");
    subscription = existing;
  }

  await save(subscription);
  return subscription;
}

export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}

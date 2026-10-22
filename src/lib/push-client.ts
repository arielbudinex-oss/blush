const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const READY_TIMEOUT_MS = 15_000;

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && Boolean(PUBLIC_KEY);
}

/** iPhone/iPad hanya mengizinkan Web Push setelah Blush dipasang ke Home Screen. */
export function needsHomeScreen() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
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

/** Ambil langganan yang benar-benar aktif, bukan sekadar flag di localStorage. */
export async function currentPushSubscription() {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/**
 * Daftarkan perangkat. Bisa dipanggil setelah izin diberikan; tidak perlu gesture baru.
 * Langganan lama disimpan ulang supaya server tetap punya endpoint terbaru.
 */
export async function subscribeToPush() {
  if (!pushSupported()) throw new Error("Browser ini belum mendukung notifikasi aplikasi.");
  if (needsHomeScreen()) {
    throw new Error("Di iPhone, tambahkan Blush ke Home Screen dulu, lalu buka dari ikon itu.");
  }
  if (Notification.permission !== "granted") throw new Error("Izin notifikasi belum diberikan.");

  const registration = await withTimeout(
    navigator.serviceWorker.register("/sw.js", { scope: "/" }),
    12_000,
    "Service worker notifikasi tidak siap. Muat ulang halaman lalu coba lagi.",
  );
  await withTimeout(
    navigator.serviceWorker.ready,
    READY_TIMEOUT_MS,
    "Service worker notifikasi tidak siap. Muat ulang halaman lalu coba lagi.",
  );

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await save(existing);
    return existing;
  }

  let subscription: PushSubscription;
  try {
    subscription = await withTimeout(
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(),
      }),
      20_000,
      "Perangkat belum menyelesaikan pendaftaran notifikasi. Coba lagi.",
    );
  } catch (error) {
    const fallback = await registration.pushManager.getSubscription();
    if (!fallback) throw error;
    subscription = fallback;
  }

  await save(subscription);
  return subscription;
}

export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}

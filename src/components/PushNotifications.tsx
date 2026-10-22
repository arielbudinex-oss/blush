"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function bytes(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function save(subscription: PushSubscription) {
  const json = subscription.toJSON();
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
}

/** Izin notifikasi browser + langganan Web Push. */
export default function PushNotifications() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sync = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !PUBLIC_KEY) {
      setSupported(false);
      return;
    }
    setPermission(Notification.permission);
    if (Notification.permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: bytes(PUBLIC_KEY),
      });
    }
    await save(subscription);
    setMessage("Notifikasi aktif di perangkat ini.");
  }, []);

  useEffect(() => {
    void sync().catch(() => setMessage("Notifikasi belum bisa disiapkan di browser ini."));
  }, [sync]);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setMessage("Izin notifikasi ditolak. Aktifkan dari pengaturan browser kalau berubah pikiran.");
        return;
      }
      await sync();
    } catch {
      setMessage("Notifikasi gagal diaktifkan. Coba dari Chrome atau Safari terbaru.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setMessage("Notifikasi dimatikan di perangkat ini.");
    } catch {
      setMessage("Gagal mematikan notifikasi.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Notifikasi</h2>
        <p className="mt-2 text-sm text-ink-soft">Browser ini belum mendukung notifikasi aplikasi. Buka lewat Chrome atau Safari terbaru.</p>
      </section>
    );
  }

  return (
    <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper-2 text-ink">
          <Icon name="chat" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl">Notifikasi</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            Dapat kabar saat ada yang suka profilmu, kalian match, atau ada pesan baru. Promosi dari admin juga lewat sini.
          </p>
          {message ? <p className="mt-2 text-xs font-medium text-ink">{message}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {permission === "granted" ? (
              <button type="button" onClick={disable} disabled={busy} className="inline-flex min-h-10 items-center rounded-full border border-line px-3 text-xs font-semibold text-ink-soft hover:text-ink disabled:opacity-60">
                Matikan notifikasi
              </button>
            ) : (
              <button type="button" onClick={enable} disabled={busy} className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-xs font-semibold text-paper disabled:opacity-60">
                {busy ? "Menyiapkan…" : "Aktifkan notifikasi"}
              </button>
            )}
            <span className="self-center text-2xs text-ink-soft">Bisa dimatikan kapan saja.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

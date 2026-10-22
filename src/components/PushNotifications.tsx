"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { pushSupported, unsubscribeFromPush } from "@/lib/push-client";

/** Izin notifikasi browser + langganan Web Push. */
export default function PushNotifications() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const ok = pushSupported();
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission);
      try {
        setSubscribed(localStorage.getItem("blush_push_active") === "1");
      } catch {
        // abaikan
      }
    }
  }, []);

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
      try {
        localStorage.setItem("blush_push_pending", "1");
      } catch {
        // abaikan
      }
      setMessage("Izin aktif. Memuat ulang…");
      window.location.reload();
      return;
    } catch (e) {
      console.error("push subscribe", e);
      setMessage(e instanceof Error ? e.message : "Notifikasi gagal diaktifkan.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      try {
        localStorage.removeItem("blush_push_active");
      } catch {
        // abaikan
      }
      setSubscribed(false);
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
            {permission === "granted" && subscribed ? (
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

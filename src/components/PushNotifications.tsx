"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { currentPushSubscription, needsHomeScreen, pushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";

/** Izin notifikasi browser + langganan Web Push. */
export default function PushNotifications() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [iosInstall, setIosInstall] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const ok = pushSupported();
    setSupported(ok);
    if (!ok) return;
    setIosInstall(needsHomeScreen());
    setPermission(Notification.permission);
    if (Notification.permission !== "granted") return;

    let alive = true;
    void currentPushSubscription()
      .then(async (existing) => {
        if (!alive) return;
        if (existing) {
          setSubscribed(true);
          await subscribeToPush().catch(() => undefined);
        } else {
          await subscribeToPush();
          if (alive) setSubscribed(true);
        }
      })
      .catch((e) => {
        if (alive) setMessage(e instanceof Error ? e.message : "Langganan notifikasi belum aktif.");
      });

    return () => {
      alive = false;
    };
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
      setBusy(false);
      setMessage("Izin aktif. Menyelesaikan langganan…");
      void subscribeToPush()
        .then(() => {
          try {
            localStorage.removeItem("blush_push_pending");
            localStorage.setItem("blush_push_active", "1");
          } catch {
            // abaikan
          }
          setSubscribed(true);
          setMessage("Notifikasi aktif di perangkat ini. Kirim notifikasi uji untuk memastikan.");
        })
        .catch((e: unknown) => {
          console.error("push subscribe", e);
          setMessage(e instanceof Error ? e.message : "Notifikasi gagal diaktifkan.");
        });
      return;
    } catch (e) {
      console.error("push subscribe", e);
      setMessage(e instanceof Error ? e.message : "Notifikasi gagal diaktifkan.");
    } finally {
      setBusy(false);
    }
  }

  async function testNotification() {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const json = (await res.json()) as { sent?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Notifikasi uji gagal dikirim.");
      setMessage(json.sent ? "Notifikasi uji dikirim. Cek layar perangkat ini." : "Belum ada perangkat yang berlangganan.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Notifikasi uji gagal dikirim.");
    } finally {
      setTesting(false);
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
          {iosInstall ? (
            <p className="mt-3 rounded-[9px] bg-paper-2 px-3 py-2 text-xs leading-relaxed text-ink-soft">
              Di iPhone, tambahkan Blush ke Home Screen lewat menu Bagikan, lalu buka dari ikon itu untuk mengaktifkan notifikasi.
            </p>
          ) : null}
          {message ? <p className="mt-2 text-xs font-medium leading-5 text-ink">{message}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {permission === "granted" && subscribed ? (
              <>
                <button type="button" onClick={testNotification} disabled={testing} className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-xs font-semibold text-paper disabled:opacity-60">
                  {testing ? "Mengirim…" : "Kirim notifikasi uji"}
                </button>
                <button type="button" onClick={disable} disabled={busy} className="inline-flex min-h-10 items-center rounded-full border border-line px-3 text-xs font-semibold text-ink-soft hover:text-ink disabled:opacity-60">
                  Matikan
                </button>
              </>
            ) : (
              <button type="button" onClick={enable} disabled={busy || iosInstall} className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-xs font-semibold text-paper disabled:opacity-60">
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

"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { needsHomeScreen, pushSupported, subscribeToPush } from "@/lib/push-client";

const FLAG = "blush_notif_prompted";

/** Gerbang notifikasi sekali di awal. Browser tetap bisa menolak; sediakan jalan lanjut. */
export default function NotificationGate() {
  const [open, setOpen] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iosInstall, setIosInstall] = useState(false);

  useEffect(() => {
    setIosInstall(needsHomeScreen());
    if (!pushSupported()) return;
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;
    try {
      if (localStorage.getItem(FLAG) === "1") return;
    } catch {
      return;
    }
    const id = window.setTimeout(() => setOpen(true), 650);
    return () => window.clearTimeout(id);
  }, []);

  function finish() {
    try {
      localStorage.setItem(FLAG, "1");
    } catch {
      // Mode privat: tetap tutup untuk sesi ini.
    }
    setOpen(false);
  }

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const result = await Notification.requestPermission();
      if (result !== "granted") {
        setDenied(true);
        return;
      }
      try {
        localStorage.setItem("blush_push_pending", "1");
      } catch {
        // abaikan
      }
      // Jangan tahan modal: izin sudah diberikan, langganan diselesaikan di latar belakang.
      finish();
      setBusy(false);
      void subscribeToPush()
        .then(() => {
          try {
            localStorage.removeItem("blush_push_pending");
            localStorage.setItem("blush_push_active", "1");
          } catch {
            // abaikan
          }
        })
        .catch((e) => console.error("push subscribe", e));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Notifikasi belum bisa diaktifkan.");
      try {
        localStorage.setItem("blush_push_pending", "1");
      } catch {
        // abaikan
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="notif-title">
      <div className="w-full max-w-[420px] rounded-[24px] border border-line bg-paper p-5 shadow-[0_28px_80px_-24px_rgba(0,0,0,0.45)]">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-blush/15 text-blush-deep">
          <Icon name="chat" className="h-6 w-6" />
        </span>
        <h2 id="notif-title" className="mt-4 text-2xl font-bold tracking-[-0.02em]">
          Nyalakan notifikasi dulu
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Supaya kamu tidak ketinggalan like, match baru, dan pesan masuk. Promosi dari Blush juga lewat sini.
        </p>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-ink">
          <li className="flex items-center gap-2"><Icon name="heart" className="h-4 w-4 text-blush-deep" /> Kabar saat ada yang suka</li>
          <li className="flex items-center gap-2"><Icon name="chat" className="h-4 w-4 text-blush-deep" /> Pesan dan match baru</li>
          <li className="flex items-center gap-2"><Icon name="shield" className="h-4 w-4 text-blush-deep" /> Bisa dimatikan kapan saja</li>
        </ul>

        {iosInstall ? (
          <p className="mt-4 rounded-[10px] bg-paper-2 px-3 py-2 text-xs leading-relaxed text-ink-soft">
            Di iPhone, notifikasi hanya bekerja setelah Blush ditambahkan ke Home Screen. Buka menu Bagikan, pilih Tambahkan ke Home Screen, lalu buka Blush dari ikon itu.
          </p>
        ) : null}
        {denied ? (
          <p className="mt-4 rounded-[10px] bg-paper-2 px-3 py-2 text-xs leading-relaxed text-ink-soft">
            Browser memblokir izin. Buka ikon gembok di address bar, izinkan notifikasi, lalu muat ulang. Kamu tetap bisa lanjut sekarang.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-xs font-medium text-blush-deep">{error}</p> : null}

        <div className="mt-5 flex flex-col gap-2">
          {!denied && !iosInstall ? (
            <button
              type="button"
              onClick={enable}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {busy ? "Menyiapkan…" : "Aktifkan notifikasi"}
            </button>
          ) : null}
          {error || denied || iosInstall ? (
            <button type="button" onClick={finish} className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-4 text-sm font-semibold text-ink-soft hover:text-ink">
              {iosInstall ? "Mengerti" : "Lanjut tanpa notifikasi"}
            </button>
          ) : (
            <button type="button" onClick={finish} className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-ink-soft hover:text-ink">
              Nanti saja
            </button>
          )}
          <p className="text-center text-2xs text-ink-faint">Izin hanya diminta sekali di awal.</p>
        </div>
      </div>
    </div>
  );
}

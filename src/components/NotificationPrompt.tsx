"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { pushSupported, subscribeToPush } from "@/lib/push-client";

/** Banner yang mendorong semua user menyalakan notifikasi match dan chat. */
export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!pushSupported()) return;
    setShow(Notification.permission === "default");
  }, []);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await Notification.requestPermission();
      if (result !== "granted") {
        setShow(false);
        return;
      }
      await subscribeToPush();
      setShow(false);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Notifikasi belum bisa diaktifkan.");
    } finally {
      setBusy(false);
    }
  }

  if (!show) return null;

  return (
    <div className="mx-auto mb-[var(--space-md)] w-full max-w-5xl px-[var(--space-md)] pt-[var(--space-md)]" role="region" aria-label="Aktifkan notifikasi">
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-blush-deep/25 bg-blush/10 px-3 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-blush-deep">
          <Icon name="chat" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Jangan lewatkan match pertamamu</p>
          <p className="text-xs text-ink-soft">
            Nyalakan notifikasi supaya kabar like, match, dan chat langsung sampai. Promosi juga lewat sini.
          </p>
          {message ? <p className="mt-1 text-xs font-medium text-blush-deep">{message}</p> : null}
        </div>
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-xs font-semibold text-paper disabled:opacity-60"
        >
          {busy ? "Menyiapkan…" : "Nyalakan notifikasi"}
        </button>
      </div>
    </div>
  );
}

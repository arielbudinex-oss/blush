"use client";

import { useState } from "react";

export default function AdminPush() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("/app/discover");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, url }),
      });
      const json = (await res.json()) as { sent?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal mengirim.");
      setStatus(`Terkirim ke ${json.sent ?? 0} perangkat.`);
      setTitle("");
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
      <h2 className="text-xl">Kirim notifikasi</h2>
      <p className="mt-1 text-sm text-ink-soft">Promosi, pengumuman, atau pengingat. Hanya terkirim ke perangkat yang sudah mengizinkan notifikasi.</p>
      <form onSubmit={send} className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
          Judul
          <input
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-h-10 rounded-[8px] border border-line bg-paper px-3 text-sm font-normal text-ink"
            placeholder="Contoh: Match baru menunggu"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
          Tujuan
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-h-10 rounded-[8px] border border-line bg-paper px-3 text-sm font-normal text-ink"
            placeholder="/app/discover"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft sm:col-span-2">
          Isi
          <textarea
            required
            maxLength={180}
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-[8px] border border-line bg-paper px-3 py-2 text-sm font-normal text-ink"
            placeholder="Tulis pesan singkat yang berguna, bukan spam."
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={busy} className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-xs font-semibold text-paper disabled:opacity-60">
            {busy ? "Mengirim…" : "Kirim ke semua"}
          </button>
          {status ? <span className="text-xs font-medium text-ink">{status}</span> : null}
          {error ? <span className="text-xs font-medium text-blush-deep">{error}</span> : null}
        </div>
      </form>
    </section>
  );
}

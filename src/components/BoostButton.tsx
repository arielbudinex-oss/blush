"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { btnPrimary } from "@/components/ui";

export default function BoostButton({ activeUntil, usedThisMonth, quota }: { activeUntil: string | null; usedThisMonth: number; quota: number }) {
  const supabase = createClient();
  const router = useRouter();
  const [until, setUntil] = useState<string | null>(activeUntil);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!until) return;
    const tick = () => setLeft(Math.max(0, new Date(until).getTime() - Date.now()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [until]);

  async function activate() {
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.rpc("activate_boost");
    setBusy(false);
    if (err) {
      setError(err.message.includes("Kuota") ? "Kuota boost bulan ini habis." : "Boost belum bisa diaktifkan. Coba lagi.");
      return;
    }
    if (typeof data === "string") setUntil(data);
    router.refresh();
  }

  const active = until && left > 0;
  const minutes = Math.ceil(left / 60_000);
  const remaining = Math.max(0, quota - usedThisMonth);

  return (
    <div className="rounded-card border border-line bg-paper p-[var(--space-md)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush-tint text-blush-deep">
          <Icon name="sparkles" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">{active ? "Sorotan aktif" : "Sorotan 30 menit"}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {active
              ? `Profilmu tampil lebih dulu di deck orang lain. Sisa ${minutes} menit.`
              : `Profilmu naik ke urutan atas selama 30 menit. Sisa ${remaining} dari ${quota} kali bulan ini.`}
          </p>
          {error ? <p className="mt-2 text-sm font-semibold text-blush-deep">{error}</p> : null}
          <button
            type="button"
            className={`${btnPrimary} mt-3`}
            onClick={activate}
            disabled={busy || Boolean(active) || remaining <= 0}
          >
            {active ? "Sedang berjalan" : busy ? "Mengaktifkan…" : remaining <= 0 ? "Kuota habis" : "Aktifkan sorotan"}
          </button>
        </div>
      </div>
    </div>
  );
}

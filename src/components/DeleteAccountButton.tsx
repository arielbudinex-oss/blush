"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnDanger, btnGhost } from "@/components/ui";

export default function DeleteAccountButton() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      setBusy(false);
      setError("Akun belum terhapus. Coba lagi, atau keluar lalu masuk kembali.");
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (step === 0) {
    return (
      <button type="button" className={btnDanger} onClick={() => setStep(1)}>
        Hapus akun
      </button>
    );
  }

  return (
    <div className="rounded-card border border-blush-deep bg-blush-tint/40 p-4">
      <p className="text-sm font-bold text-ink">Hapus akun dan semua datanya?</p>
      <p className="mt-1 text-sm text-ink-soft">
        Profil, foto, chat, dan riwayat pembayaran hilang dan tidak bisa dikembalikan.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btnDanger} onClick={remove} disabled={busy}>
          {busy ? "Menghapus…" : "Ya, hapus permanen"}
        </button>
        <button type="button" className={btnGhost} onClick={() => setStep(0)} disabled={busy}>
          Batal
        </button>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-blush-deep">{error}</p> : null}
    </div>
  );
}

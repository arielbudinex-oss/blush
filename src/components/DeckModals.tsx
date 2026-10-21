"use client";

import Link from "next/link";
import { btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

/** Modal match — dipakai di dalam deck, termasuk saat deck sudah habis. */
export function MatchModal({
  matched,
  onClose,
}: {
  matched: { matchId: string; name: string } | null;
  onClose: () => void;
}) {
  if (!matched) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-[var(--space-md)]">
      <div className="w-full max-w-sm rounded-card border border-line bg-paper p-[var(--space-lg)] text-center">
        <h2 className="text-2xl">Kalian saling suka</h2>
        <p className="mt-2 text-sm text-ink-soft">{matched.name} juga nge-like kamu. Chat-nya sudah terbuka.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link href={`/app/chat/${matched.matchId}`} className={btnPrimary}>
            Buka chat
          </Link>
          <button type="button" className={btnGhost} onClick={onClose}>
            Lanjut swipe
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal laporan profil. */
export function ReportModal({
  name,
  reason,
  details,
  reasons,
  busy,
  onReason,
  onDetails,
  onSubmit,
  onClose,
}: {
  name: string;
  reason: string;
  details: string;
  reasons: string[];
  busy: boolean;
  onReason: (v: string) => void;
  onDetails: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-[var(--space-md)]">
      <div className="w-full max-w-sm rounded-card border border-line bg-paper p-[var(--space-lg)]">
        <h2 className="text-xl">Laporkan {name || "profil ini"}</h2>
        <label className={label} htmlFor="reason">
          Alasan
        </label>
        <select id="reason" className={inputBase} value={reason} onChange={(e) => onReason(e.target.value)}>
          {reasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <label className={`${label} mt-3`} htmlFor="details">
          Detail (opsional)
        </label>
        <textarea id="details" className={inputBase} rows={3} value={details} onChange={(e) => onDetails(e.target.value)} />
        <div className="mt-4 flex gap-2">
          <button type="button" className={btnPrimary} onClick={onSubmit} disabled={busy}>
            Kirim laporan
          </button>
          <button type="button" className={btnGhost} onClick={onClose}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { AnimatePresence, MatchBurst, motion, useReducedMotion } from "@/components/motion";
import { btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

/** Modal match: kartu pegas + cincin partikel. Konten tetap tampil walau reduced motion. */
export function MatchModal({
  matched,
  onClose,
}: {
  matched: { matchId: string; name: string } | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {matched ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-[var(--space-md)]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Kalian saling suka"
        >
          <motion.div
            className="w-full max-w-sm rounded-card border border-line bg-paper p-[var(--space-lg)] text-center"
            initial={reduce ? false : { scale: 0.9, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <MatchBurst label={matched.name} />
            <h2 className="text-[1.75rem] leading-[1.1]">
              Kalian <em className="font-medium text-blush-deep">saling suka</em>.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {matched.name} juga suka kamu. Chat-nya sudah kebuka. Balas sebelum 24 jam, biar nggak hilang.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href={`/app/chat/${matched.matchId}`} className={btnPrimary}>
                Buka chat
              </Link>
              <button type="button" className={btnGhost} onClick={onClose}>
                Lanjut swipe
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-[var(--space-md)] sm:items-center"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Laporkan ${name}`}
      >
        <motion.div
          className="w-full max-w-sm rounded-card border border-line bg-paper p-[var(--space-lg)]"
          initial={reduce ? false : { y: 36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
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
          <textarea
            id="details"
            className={inputBase}
            rows={3}
            value={details}
            onChange={(e) => onDetails(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={onSubmit} disabled={busy}>
              Kirim laporan
            </button>
            <button type="button" className={btnGhost} onClick={onClose}>
              Batal
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

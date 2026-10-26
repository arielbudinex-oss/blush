"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "@/components/motion";
import VerifiedBadge from "@/components/VerifiedBadge";
import { btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

/** Modal match: kartu pegas + cincin partikel. Konten tetap tampil walau reduced motion. */
export function MatchModal({
  matched,
  onClose,
  onViewProfile,
}: {
  matched: { matchId: string; name: string; candidate: import("@/components/SwipeDeck").Candidate } | null;
  onClose: () => void;
  onViewProfile: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {matched ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-[var(--space-md)]"
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
            <div className="relative mx-auto mb-5 flex h-36 w-full items-center justify-center" aria-hidden="true">
              <motion.span
                className="absolute h-24 w-24 rounded-full border border-blush-deep/35"
                initial={reduce ? false : { scale: 0.35, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { scale: [0.55, 1.28], opacity: [0.5, 0] }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.span
                className="absolute h-32 w-32 rounded-full border border-blush-deep/20"
                initial={reduce ? false : { scale: 0.35, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { scale: [0.45, 1.18], opacity: [0.32, 0] }}
                transition={{ duration: 0.9, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
              <div className="relative flex -space-x-4">
                {matched.candidate.photos.slice(0, 1).map((path) => (
                  <motion.img key={path} src={path.startsWith("http") ? path : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${path}`} alt="" className="h-20 w-20 rounded-full border-4 border-paper object-cover shadow-md" initial={reduce ? false : { x: -28, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }} />
                ))}
                <motion.span className="grid h-20 w-20 place-items-center rounded-full border-4 border-paper bg-blush-tint text-blush-deep shadow-md" initial={reduce ? false : { x: 28, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.32, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}>
                  <VerifiedBadge size={25} />
                </motion.span>
              </div>
            </div>
            <h2 className="font-display text-[1.75rem] font-bold leading-[1.1] text-ink">
              Kalian saling suka.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {matched.name} juga suka kamu. Kirim pesan pertama kalau siap.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link href={`/app/chat/${matched.matchId}`} className={btnPrimary}>
                Kirim pesan
              </Link>
              <button type="button" className={btnGhost} onClick={onViewProfile}>
                Lihat profil
              </button>
            </div>
            <button type="button" className="mt-3 min-h-11 w-full text-sm font-semibold text-ink-soft" onClick={onClose}>
              Lanjut geser
            </button>
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
        className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 p-[var(--space-md)] sm:items-center"
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

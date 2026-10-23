"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "@/components/motion";
import { Icon } from "@/components/Icon";
import VerifiedBadge from "@/components/VerifiedBadge";
import { photoUrl, distanceLabel } from "@/lib/photo";
import { btnGhost, btnPrimary, btnDanger } from "@/components/ui";

type SheetCandidate = {
  id: string;
  display_name: string;
  age: number | null;
  bio: string;
  job: string;
  city: string;
  intent: "relationship" | "dating" | "friends";
  is_verified: "none" | "pending" | "approved" | "rejected";
  distance_m: number | null;
  photos: string[];
  interests: string[];
  prompts?: { q: string; a: string }[];
  vitals?: Record<string, string | number | string[] | null>;
};

const INTENT: Record<SheetCandidate["intent"], string> = {
  relationship: "Cari hubungan serius",
  dating: "Cari kencan",
  friends: "Cari teman ngobrol",
};

const VITAL: Record<string, string> = {
  tinggi: "Tinggi",
  olahraga: "Olahraga",
  alkohol: "Alkohol",
  rokok: "Rokok",
  hewan: "Hewan",
  zodiak: "Zodiak",
  pendidikan: "Pendidikan",
  kota_asal: "Kota asal",
};

export default function ProfileSheet({
  candidate,
  open,
  superLeft,
  busy,
  onClose,
  onDecide,
  onReport,
  onBlock,
}: {
  candidate: SheetCandidate | null;
  open: boolean;
  superLeft: number;
  busy: boolean;
  onClose: () => void;
  onDecide: (action: "like" | "pass" | "superlike") => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  const reduce = useReducedMotion();
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    if (!open) return;
    setPhoto(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, candidate?.id]);

  const photos = (candidate?.photos ?? []).map((p) => photoUrl(p)).filter(Boolean) as string[];
  const vitals = Object.entries(candidate?.vitals ?? {}).filter(([, v]) => {
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });

  return (
    <AnimatePresence>
      {open && candidate ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:p-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Profil ${candidate.display_name}`}
          onClick={onClose}
        >
          <motion.div
            className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[22px] bg-paper sm:rounded-[22px]"
            initial={reduce ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold leading-tight">
                  {candidate.display_name || "Tanpa nama"}
                  {candidate.age ? <span className="font-semibold text-ink-soft">, {candidate.age}</span> : null}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {[candidate.job, candidate.city].filter(Boolean).join(" · ") || "Profil"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup profil"
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-strong text-ink hover:bg-paper-2"
              >
                <Icon name="x" className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="relative aspect-[4/5] max-h-[42dvh] w-full bg-paper-2">
                {photos[photo] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[photo]} alt={`Foto ${candidate.display_name} ${photo + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-sm text-ink-soft">Belum ada foto</span>
                )}
                {photos.length > 1 ? (
                  <>
                    <button
                      type="button"
                      aria-label="Foto sebelumnya"
                      onClick={() => setPhoto((i) => (i - 1 + photos.length) % photos.length)}
                      className="absolute inset-y-0 left-0 w-1/3"
                    />
                    <button
                      type="button"
                      aria-label="Foto berikutnya"
                      onClick={() => setPhoto((i) => (i + 1) % photos.length)}
                      className="absolute inset-y-0 right-0 w-1/3"
                    />
                    <div className="absolute inset-x-0 top-2 flex gap-1 px-3">
                      {photos.map((_, i) => (
                        <span key={i} className={`h-1 flex-1 rounded-full ${i === photo ? "bg-paper" : "bg-paper/45"}`} />
                      ))}
                    </div>
                  </>
                ) : null}
                {candidate.is_verified === "approved" ? (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-paper/95 px-2 py-1 text-2xs font-bold text-ink">
                    <VerifiedBadge size={14} /> Terverifikasi
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 px-4 pb-6 pt-4">
                <div className="flex flex-wrap gap-1.5">
                  <Chip icon="sparkles" text={INTENT[candidate.intent] ?? "Lagi cari"} />
                  {candidate.distance_m !== null ? <Chip icon="location" text={distanceLabel(candidate.distance_m)} /> : null}
                </div>

                {candidate.bio ? (
                  <section>
                    <h3 className="text-xs font-bold text-ink-soft">Tentang</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">{candidate.bio}</p>
                  </section>
                ) : null}

                {(candidate.prompts ?? []).filter((p) => p.a?.trim()).map((p) => (
                  <section key={p.q} className="rounded-[12px] border border-line bg-paper-2/60 px-3.5 py-3">
                    <p className="text-sm font-bold leading-snug text-ink">{p.q}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.a}</p>
                  </section>
                ))}

                {vitals.length ? (
                  <section>
                    <h3 className="text-xs font-bold text-ink-soft">Detail</h3>
                    <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                      {vitals.map(([k, v]) => (
                        <div key={k} className="flex min-w-0 gap-1">
                          <dt className="shrink-0 text-ink-soft">{VITAL[k] ?? k}:</dt>
                          <dd className="truncate text-ink">
                            {Array.isArray(v) ? v.join(", ") : k === "tinggi" ? `${v} cm` : String(v)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ) : null}

                {candidate.interests.length ? (
                  <section>
                    <h3 className="text-xs font-bold text-ink-soft">Minat</h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {candidate.interests.map((i) => (
                        <span key={i} className="rounded-full border border-line px-2.5 py-1 text-xs font-medium capitalize text-ink-soft">
                          {i.replace(/-/g, " ")}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}

                <div className="flex gap-3 border-t border-line pt-3 text-xs font-semibold">
                  <button type="button" className="inline-flex items-center gap-1 text-ink-soft hover:text-ink" onClick={onReport}>
                    <Icon name="flag" className="h-4 w-4" /> Laporkan
                  </button>
                  <button type="button" className="inline-flex items-center gap-1 text-blush-deep hover:text-ink" onClick={onBlock}>
                    <Icon name="ban" className="h-4 w-4" /> Blokir
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-line bg-paper px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_24px_-24px_rgba(0,0,0,0.45)]">
              <button
                type="button"
                className={btnGhost}
                disabled={busy}
                onClick={() => {
                  onDecide("pass");
                  onClose();
                }}
              >
                <Icon name="x" className="h-4 w-4" /> Lewati
              </button>
              <button
                type="button"
                className={btnGhost}
                disabled={busy || superLeft <= 0}
                onClick={() => {
                  onDecide("superlike");
                  onClose();
                }}
              >
                <Icon name="star" className="h-4 w-4" /> Superlike
              </button>
              <button
                type="button"
                className={btnPrimary}
                disabled={busy}
                onClick={() => {
                  onDecide("like");
                  onClose();
                }}
              >
                <Icon name="heart" className="h-4 w-4" filled /> Suka
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Chip({ icon, text }: { icon: "sparkles" | "location" | "user"; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-2.5 py-1 text-2xs font-semibold text-ink-soft">
      <Icon name={icon} className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

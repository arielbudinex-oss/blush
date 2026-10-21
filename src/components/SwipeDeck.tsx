"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useTransform, animate } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { distanceLabel, photoUrl } from "@/lib/photo";
import { MatchModal, ReportModal } from "@/components/DeckModals";
import { CountUp } from "@/components/motion";
import { Icon } from "@/components/Icon";
import { btnDanger, btnGhost, btnPrimary } from "@/components/ui";

export type Candidate = {
  id: string;
  display_name: string;
  age: number | null;
  gender: "woman" | "man" | "nonbinary";
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

type Action = "like" | "pass" | "superlike";

const REPORT_REASONS = ["Profil palsu", "Foto tidak pantas", "Spam / jualan", "Kasar atau melecehkan", "Di bawah umur"];

const VITAL_LABEL: Record<string, string> = {
  tinggi: "Tinggi",
  olahraga: "Olahraga",
  alkohol: "Alkohol",
  rokok: "Rokok",
  hewan: "Hewan",
  zodiak: "Zodiak",
  pendidikan: "Pendidikan",
  kota_asal: "Kota asal",
};

function CheckBadge() {
  return (
    <span
      title="Terverifikasi"
      className="inline-grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-verify text-white"
    >
      <Icon name="check" className="h-3 w-3" strokeWidth={2.8} />
      <span className="sr-only">Terverifikasi</span>
    </span>
  );
}

function SwipeCard({
  candidate,
  busy,
  onDecide,
  onUndo,
  canUndo,
}: {
  candidate: Candidate;
  busy: boolean;
  onDecide: (action: Action) => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-280, 0, 280], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [28, 120], [0, 1]);
  const passOpacity = useTransform(x, [-28, -120], [0, 1]);
  const superOpacity = useTransform(y, [-28, -118], [0, 1]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [flying, setFlying] = useState(false);

  const photos = useMemo(
    () => candidate.photos.map((p) => photoUrl(p)).filter(Boolean) as string[],
    [candidate.photos],
  );
  const prompt = candidate.prompts?.find((p) => p.a?.trim());

  const fly = useCallback(
    async (action: Action) => {
      if (flying || busy) return;
      setFlying(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(action === "superlike" ? 18 : 10);
      const to = action === "pass" ? { x: -640, y: 70 } : action === "like" ? { x: 640, y: 70 } : { x: 0, y: -740 };
      if (!reduce) {
        await Promise.all([
          animate(x, to.x, { duration: 0.3, ease: [0.22, 1, 0.36, 1] }),
          animate(y, to.y, { duration: 0.3, ease: [0.22, 1, 0.36, 1] }),
        ]);
      }
      onDecide(action);
    },
    [flying, busy, reduce, x, y, onDecide],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") void fly("like");
      else if (e.key === "ArrowLeft") void fly("pass");
      else if (e.key === "ArrowUp") void fly("superlike");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fly]);

  const vitalRows = Object.entries(candidate.vitals ?? {}).filter(([, v]) => {
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });

  return (
    <motion.article
      drag
      dragElastic={0.16}
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -125 && Math.abs(info.offset.x) < 95) void fly("superlike");
        else if (info.offset.x > 108 || info.velocity.x > 620) void fly("like");
        else if (info.offset.x < -108 || info.velocity.x < -620) void fly("pass");
        else {
          void Promise.all([
            animate(x, 0, { type: "spring", stiffness: 340, damping: 30 }),
            animate(y, 0, { type: "spring", stiffness: 340, damping: 30 }),
          ]);
        }
      }}
      style={{ x, y, rotate }}
      initial={reduce ? false : { opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative isolate touch-pan-y select-none overflow-hidden rounded-[22px] border border-line bg-paper shadow-[0_24px_60px_-30px_oklch(0.35_0.1_20)]"
    >
      <div className="pointer-events-none absolute inset-0 z-20">
        <motion.span
          style={{ opacity: likeOpacity }}
          className="absolute left-4 top-5 -rotate-12 rounded-[8px] border-2 border-ok px-3 py-1 font-display text-lg font-bold uppercase tracking-[0.1em] text-ok"
        >
          Suka
        </motion.span>
        <motion.span
          style={{ opacity: passOpacity }}
          className="absolute right-4 top-5 rotate-12 rounded-[8px] border-2 border-ink-faint px-3 py-1 font-display text-lg font-bold uppercase tracking-[0.1em] text-ink-faint"
        >
          Lewati
        </motion.span>
        <motion.span
          style={{ opacity: superOpacity }}
          className="absolute inset-x-0 bottom-24 mx-auto w-max rounded-[8px] border-2 border-blush-deep bg-paper/85 px-3 py-1 font-display text-lg font-bold uppercase tracking-[0.1em] text-blush-deep"
        >
          Superlike
        </motion.span>
      </div>

      <div className="deck-photo relative w-full bg-blush-tint">
        {photos[photoIdx] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[photoIdx]}
            alt={`Foto ${candidate.display_name}`}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm font-semibold text-blush-deep">
            Belum ada foto
          </span>
        )}

        {photos.length > 1 ? (
          <>
            <div className="absolute inset-x-0 top-0 z-10 flex gap-1 px-3 pt-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Foto ${i + 1}`}
                  onClick={() => setPhotoIdx(i)}
                  className={`h-1 flex-1 rounded-[999px] transition-colors duration-200 ${
                    i === photoIdx ? "bg-paper" : "bg-paper/45"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Foto sebelumnya"
              onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
              className="absolute left-0 top-0 h-full w-1/3"
            />
            <button
              type="button"
              aria-label="Foto berikutnya"
              onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}
              className="absolute right-0 top-0 h-full w-1/3"
            />
          </>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-4 pb-4 pt-20 text-white">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="max-w-full truncate text-[1.7rem] leading-none text-white">{candidate.display_name || "Tanpa nama"}</h2>
            {candidate.age ? (
              <span className="rounded-[999px] bg-white/18 px-2 py-0.5 text-sm font-bold leading-tight text-white backdrop-blur-sm">
                {candidate.age}
              </span>
            ) : null}
            {candidate.is_verified === "approved" ? <CheckBadge /> : null}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-white/90">
            {candidate.job ? `${candidate.job} · ` : ""}
            {candidate.city || "Kota belum diisi"} · {distanceLabel(candidate.distance_m)}
          </p>
        </div>
      </div>

      <div className="px-[var(--space-md)] pb-2 pt-3">
        {candidate.bio ? <p className="line-clamp-2 text-sm text-ink-soft">{candidate.bio}</p> : null}

        {prompt ? (
          <div className="mt-2 rounded-[12px] bg-paper-2 px-3 py-2">
            <p className="text-xs font-semibold text-ink-soft">{prompt.q}</p>
            <p className="mt-0.5 line-clamp-1 text-sm text-ink">{prompt.a}</p>
          </div>
        ) : null}

        {candidate.interests.length > 0 ? (
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
            {candidate.interests.slice(0, 8).map((i) => (
              <span
                key={i}
                className="shrink-0 rounded-[999px] border border-line px-2.5 py-1 text-2xs font-semibold capitalize text-ink-soft"
              >
                {i.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        ) : null}

        {vitalRows.length > 0 ? (
          <dl className="mt-2 hidden grid-cols-2 gap-x-3 gap-y-1 text-2xs text-ink-soft sm:grid">
            {vitalRows.slice(0, 4).map(([k, v]) => (
              <div key={k} className="flex min-w-0 gap-1">
                <dt className="shrink-0 text-ink-faint">{VITAL_LABEL[k] ?? k}:</dt>
                <dd className="truncate">{Array.isArray(v) ? v.join(", ") : k === "tinggi" ? `${v} cm` : String(v)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-line bg-paper px-[var(--space-md)] py-[var(--space-sm)]">
        <button
          type="button"
          onClick={() => void fly("pass")}
          disabled={busy || flying}
          aria-label="Lewati"
          className="grid h-14 w-14 place-items-center rounded-[999px] border border-line-strong bg-paper text-ink shadow-[0_6px_18px_-10px_rgba(0,0,0,.45)] transition-transform duration-150 active:scale-95 disabled:opacity-50"
        >
          <Icon name="x" className="h-6 w-6" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={busy || flying || !canUndo}
          aria-label="Batalkan swipe terakhir"
          className="grid h-10 w-10 place-items-center rounded-[999px] border border-line-strong bg-paper text-ink-soft transition-transform duration-150 active:scale-95 disabled:border-line disabled:bg-paper-2 disabled:text-ink-faint"
        >
          <Icon name="undo" className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => void fly("superlike")}
          disabled={busy || flying}
          aria-label="Superlike"
          className="grid h-14 w-14 place-items-center rounded-[999px] border border-ok bg-paper text-ok shadow-[0_6px_18px_-10px_rgba(0,0,0,.45)] transition-transform duration-150 active:scale-95 disabled:opacity-50"
        >
          <Icon name="star" className="h-6 w-6" filled />
        </button>
        <button
          type="button"
          onClick={() => void fly("like")}
          disabled={busy || flying}
          aria-label="Suka"
          className="grid h-16 w-16 place-items-center rounded-[999px] bg-blush-deep text-paper shadow-[0_12px_28px_-12px_oklch(0.47_0.16_12)] transition-transform duration-150 active:scale-95 disabled:opacity-50"
        >
          <Icon name="heart" className="h-7 w-7" filled />
        </button>
      </div>
    </motion.article>
  );
}

export default function SwipeDeck({
  candidates,
  likesUsed,
  dailyLikes,
  isVerified,
}: {
  candidates: Candidate[];
  likesUsed: number;
  dailyLikes: number;
  isVerified: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [index, setIndex] = useState(0);
  const [used, setUsed] = useState(likesUsed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<{ matchId: string; name: string } | null>(null);
  const [reportFor, setReportFor] = useState<Candidate | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [canUndo, setCanUndo] = useState(false);

  const current = candidates[index];
  const unlimited = dailyLikes >= 100000;
  const likesLeft = unlimited ? Infinity : Math.max(0, dailyLikes - used);

  const decide = useCallback(
    async (action: Action) => {
      const target = candidates[index];
      if (!target) return;
      if (action !== "pass" && !unlimited && likesLeft <= 0) {
        setError("Kuota like hari ini habis. Naikkan paket untuk swipe tanpa batas, atau kembali besok.");
        setIndex((i) => i);
        return;
      }
      setBusy(true);
      setError(null);
      setIndex((i) => i + 1);
      if (action !== "pass") setUsed((u) => u + 1);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sesi habis, masuk ulang.");
        setBusy(false);
        return;
      }
      const { error: insErr } = await supabase
        .from("swipes")
        .insert({ actor_id: user.id, target_id: target.id, action });
      if (insErr && !insErr.message.includes("duplicate")) {
        setError(insErr.message);
        setBusy(false);
        return;
      }
      setCanUndo(true);

      if (action !== "pass") {
        const { data: myMatches } = await supabase.rpc("my_matches");
        const match = (myMatches ?? []).find(
          (m: { match_id: string; other_id: string }) => m.other_id === target.id,
        );
        if (match?.match_id) setMatched({ matchId: match.match_id, name: target.display_name || "Seseorang" });
      }
      setBusy(false);
    },
    [candidates, index, unlimited, likesLeft, supabase],
  );

  async function undo() {
    setBusy(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setBusy(false);
    const { data: last } = await supabase
      .from("swipes")
      .select("id")
      .eq("actor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!last) {
      setError("Belum ada swipe yang bisa dibatalkan.");
      setBusy(false);
      return;
    }
    const { error: delErr } = await supabase.from("swipes").delete().eq("id", last.id);
    setBusy(false);
    if (delErr) return setError(delErr.message);
    setIndex((i) => Math.max(0, i - 1));
    setUsed((u) => Math.max(0, u - 1));
    router.refresh();
  }

  async function submitReport() {
    if (!reportFor) return;
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setBusy(false);
    const { error: err } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: reportFor.id,
      reason: reportReason,
      details: reportDetails.trim() || null,
    });
    setBusy(false);
    if (err) return setError(err.message);
    setReportFor(null);
    setReportDetails("");
    setError("Laporan terkirim. Terima kasih. Profil ini masuk antrean review.");
  }

  async function block(candidate: Candidate) {
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setBusy(false);
    await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: candidate.id });
    await supabase.from("swipes").insert({ actor_id: user.id, target_id: candidate.id, action: "pass" });
    setBusy(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-4 lg:max-w-4xl lg:grid-cols-[minmax(0,440px)_minmax(0,300px)] lg:justify-center lg:gap-8">
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold tracking-[-0.01em]">Untukmu</h1>
          <span
            className={`rounded-[999px] bg-paper-2 px-2.5 py-1 text-2xs font-bold ${
              likesLeft === 0 ? "text-blush-deep" : "text-ink"
            }`}
          >
            {unlimited ? (
              "Swipe tanpa batas"
            ) : (
              <>
                Sisa <CountUp value={likesLeft} /> like
              </>
            )}
          </span>
        </div>

        <div className="relative">
          {current ? <SwipeCard key={current.id} candidate={current} busy={busy} onDecide={decide} onUndo={undo} canUndo={canUndo} /> : null}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {!current ? (
            <div className="grid min-h-[52dvh] place-items-center rounded-[20px] border border-line bg-paper px-5 py-8">
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-[999px] bg-blush-tint text-blush-deep">
                  <Icon name="heart" className="h-7 w-7" />
                </span>
                <h2 className="mt-3 text-lg">Belum ada yang baru</h2>
                <p className="mx-auto mt-1 max-w-[16rem] text-sm text-ink-soft">
                  Filter kamu terlalu ketat, atau kamu sudah lihat semua orang di sekitar.
                </p>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <Link href="/app/profile" className={btnPrimary}>
                    Ubah preferensi
                  </Link>
                  <button type="button" className="text-sm font-semibold text-ink-soft underline" onClick={() => router.refresh()}>
                    Muat ulang
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <p
              role="status"
              className="rounded-[12px] border border-blush-deep bg-blush-tint px-3 py-2 text-sm font-semibold text-blush-deep"
            >
              {error}
            </p>
          ) : null}
        </div>

        {current ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-[999px] px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-2"
                onClick={() => setReportFor(current)}
              >
                Laporkan
              </button>
              <button
                type="button"
                className="rounded-[999px] px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-2"
                onClick={() => block(current)}
                disabled={busy}
              >
                Blokir
              </button>
            </div>
            <span className="text-2xs text-ink-faint">Geser untuk memilih</span>
          </div>
        ) : null}
      </div>

      <aside className="hidden flex-col gap-3 self-start lg:flex">
        {!isVerified ? (
          <div className="rounded-[18px] border border-line bg-paper-2 p-4">
            <div className="flex items-center gap-2 text-verify">
              <Icon name="shield" className="h-5 w-5" />
              <span className="text-sm font-bold">Centang biru</span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              Nggak wajib. Kalau mau, pindai wajah sekali dan badge-nya nempel di profil.
            </p>
            <Link href="/app/verify" className={`${btnGhost} mt-3 w-full`}>
              Verifikasi wajah
            </Link>
          </div>
        ) : (
          <div className="rounded-[18px] border border-verify/30 bg-verify/5 p-4">
            <p className="text-sm font-bold text-verify">Profil kamu terverifikasi</p>
            <p className="mt-1 text-sm text-ink-soft">Centang birunya sudah muncul di kartu dan profil.</p>
          </div>
        )}

        <div className="rounded-[18px] border border-line bg-paper p-4">
          <p className="text-xs font-semibold text-ink-soft">Hari ini</p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-ink-soft">Profil di deck</span>
            <span className="font-bold">{candidates.length}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-ink-soft">Like terpakai</span>
            <span className="font-bold">{unlimited ? `${used} · tanpa batas` : `${used} / ${dailyLikes}`}</span>
          </div>
        </div>

        <Link href="/app/premium" className="rounded-[18px] bg-blush-deep p-4 text-paper">
          <p className="text-sm font-bold">Swipe tanpa batas</p>
          <p className="mt-1 text-xs text-paper/95">Blush Plus buka semua like dan superlike harian.</p>
        </Link>

        <Link href="/app/likes" className="rounded-[18px] border border-line bg-paper-2 p-4">
          <p className="text-sm font-bold text-ink">Yang suka kamu</p>
          <p className="mt-1 text-xs text-ink-soft">Mereka sudah suka duluan. Tinggal kamu balas.</p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blush-deep">
            Buka Likes
            <Icon name="chevron" className="h-3.5 w-3.5" strokeWidth={2.4} />
          </span>
        </Link>
      </aside>

      <MatchModal matched={matched} onClose={() => setMatched(null)} />

      {reportFor ? (
        <ReportModal
          name={reportFor.display_name}
          reason={reportReason}
          details={reportDetails}
          reasons={REPORT_REASONS}
          busy={busy}
          onReason={setReportReason}
          onDetails={setReportDetails}
          onSubmit={submitReport}
          onClose={() => setReportFor(null)}
        />
      ) : null}
    </div>
  );
}

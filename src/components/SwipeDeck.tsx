"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useTransform, animate } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { distanceLabel, photoUrl } from "@/lib/photo";
import { MatchModal, ReportModal } from "@/components/DeckModals";
import ProfileSheet from "@/components/ProfileSheet";
import FiltersSheet from "@/components/FiltersSheet";
import { CountUp } from "@/components/motion";
import { Icon } from "@/components/Icon";
import VerifiedBadge from "@/components/VerifiedBadge";
import EmojiText from "@/components/emoji/EmojiText";
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
  return <VerifiedBadge size={16} />;
}

function SwipeCard({
  candidate,
  busy,
  onDecide,
  onUndo,
  canUndo,
  superLeft,
  onReport,
  onBlock,
  onOpenProfile,
  myInterests,
}: {
  candidate: Candidate;
  myInterests?: string[];
  busy: boolean;
  onDecide: (action: Action) => Promise<boolean>;
  onUndo: () => void;
  canUndo: boolean;
  superLeft: number;
  onReport: () => void;
  onBlock: () => void;
  onOpenProfile: () => void;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-280, 0, 280], [-10, 0, 10]);
  const likeOpacity = useTransform(x, [32, 112], [0, 1]);
  const passOpacity = useTransform(x, [-32, -112], [0, 1]);
  const superOpacity = useTransform(y, [-32, -108], [0, 1]);
  const cardScale = useTransform(x, [-280, 0, 280], [0.965, 1, 0.965]);
  const likeX = useTransform(x, [0, 220], [0, 22]);
  const passX = useTransform(x, [-220, 0], [-22, 0]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [flying, setFlying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const photos = useMemo(
    () => candidate.photos.map((p) => photoUrl(p)).filter(Boolean) as string[],
    [candidate.photos],
  );
  const prompt = candidate.prompts?.find((p) => p.a?.trim());
  const mine = new Set((myInterests ?? []).map((i) => i.toLowerCase()));
  const shared = candidate.interests.filter((i) => mine.has(i.toLowerCase()));

  const fly = useCallback(
    async (action: Action) => {
      if (flying || busy) return;
      setFlying(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(action === "superlike" ? 18 : 10);
      const direction = action === "pass" ? -1 : 1;
      const to = action === "superlike" ? { x: 0, y: -Math.max(420, window.innerHeight * 0.8) } : { x: direction * Math.max(420, window.innerWidth * 1.15), y: 24 };
      if (!reduce) {
        await Promise.all([
          animate(x, to.x, { type: "spring", stiffness: 300, damping: 34, mass: 0.9 }),
          animate(y, to.y, { type: "spring", stiffness: 280, damping: 34, mass: 0.85 }),
        ]);
      }
      const accepted = await onDecide(action);
      if (!accepted) {
        // Kuota habis atau sesi mati: kartu kembali ke tempatnya, tombol tetap bisa dipakai.
        setFlying(false);
        void Promise.all([
          animate(x, 0, { type: "spring", stiffness: 340, damping: 30 }),
          animate(y, 0, { type: "spring", stiffness: 340, damping: 30 }),
        ]);
      }
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
      dragElastic={0.08}
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -118 && Math.abs(info.offset.x) < 90) void fly("superlike");
        else if (info.offset.x > 116 || info.velocity.x > 760) void fly("like");
        else if (info.offset.x < -116 || info.velocity.x < -760) void fly("pass");
        else {
          void Promise.all([
            animate(x, 0, { type: "spring", stiffness: 340, damping: 30 }),
            animate(y, 0, { type: "spring", stiffness: 340, damping: 30 }),
          ]);
        }
      }}
      style={{ x, y, rotate, scale: cardScale, touchAction: "pan-y" }}
      initial={reduce ? false : { opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative isolate touch-pan-y select-none overflow-hidden rounded-[20px] border border-line bg-paper shadow-[0_24px_60px_-30px_oklch(0.35_0.1_20)]"
    >
      <div className="pointer-events-none absolute inset-0 z-20">
        <motion.span
          style={{ opacity: likeOpacity, x: likeX }}
          className="absolute left-4 top-5 -rotate-12 rounded-[8px] border-2 border-ok px-3 py-1 font-display text-lg font-bold uppercase tracking-[0.1em] text-ok"
        >
          Suka
        </motion.span>
        <motion.span
          style={{ opacity: passOpacity, x: passX }}
          className="absolute right-4 top-5 rotate-12 rounded-[10px] border-[2.5px] border-ink-faint px-3 py-1 text-xl text-ink-faint"
        >
          lewat
        </motion.span>
        <motion.span
          style={{ opacity: superOpacity }}
          className="absolute inset-x-0 bottom-24 mx-auto w-max rounded-[10px] border-[2.5px] border-blush-deep bg-paper/85 px-3 py-1 text-xl text-blush-deep"
        >
          superlike
        </motion.span>
      </div>

      <div className="deck-photo relative w-full bg-paper-2">
        {photos[photoIdx] ? (
          <Image
            src={photos[photoIdx]}
            alt={`Foto ${candidate.display_name}`}
            fill
            sizes="(max-width: 520px) 100vw, 430px"
            priority
            className="object-cover object-[center_30%]"
            draggable={false}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm font-semibold text-ink-soft">
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
                  className={`h-1.5 flex-1 rounded-[999px] transition-colors duration-200 ${
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

        <button
          type="button"
          aria-label="Lihat profil lengkap"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile();
          }}
          className="absolute left-3 top-9 z-20 grid h-9 w-9 place-items-center rounded-[999px] bg-paper/90 text-ink backdrop-blur-sm transition-colors hover:bg-paper"
        >
          <Icon name="info" className="h-4 w-4" />
        </button>

        <div className="absolute right-3 top-9 z-20">
          <button
            type="button"
            aria-label="Opsi profil"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="grid h-9 w-9 place-items-center rounded-[999px] bg-ink text-paper transition-colors hover:bg-blush-deep"
          >
            <Icon name="more" className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-11 w-40 overflow-hidden rounded-[12px] border border-line bg-paper py-1 shadow-[0_18px_40px_-24px_oklch(0.3_0.05_40)]">
              <button
                type="button"
                className="block w-full px-3.5 py-2 text-left text-sm font-medium text-ink hover:bg-paper-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onReport();
                }}
              >
                Laporkan
              </button>
              <button
                type="button"
                className="block w-full px-3.5 py-2 text-left text-sm font-medium text-blush-deep hover:bg-paper-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onBlock();
                }}
              >
                Blokir
              </button>
            </div>
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-4 pb-4 pt-20 text-white">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="min-w-0 truncate text-[1.9rem] font-bold leading-none tracking-[-0.022em] text-white">
              {candidate.display_name || "Tanpa nama"}
              {candidate.age ? <span className="text-[1.05rem] font-semibold text-white/70">, {candidate.age}</span> : null}
            </h2>
            {candidate.is_verified === "approved" ? <CheckBadge /> : null}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-white/90">
            {candidate.job ? `${candidate.job} · ` : ""}
            {candidate.city || "Kota belum diisi"} · {distanceLabel(candidate.distance_m)}
          </p>
        </div>
      </div>

      <div className="px-[var(--space-md)] pb-3 pt-3">
        {candidate.bio ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
            <EmojiText text={candidate.bio} />
          </p>
        ) : null}

        {prompt ? (
          <div className="mt-3 rounded-[10px] border border-line bg-paper px-3.5 py-2.5">
            <p className="text-[0.98rem] font-semibold leading-snug text-ink">{prompt.q}</p>
            <p className="mt-1 line-clamp-1 text-sm text-ink-soft">{prompt.a}</p>
          </div>
        ) : null}

        {shared.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-blush-deep">
            {shared.length === 1 ? `Kalian sama-sama suka ${shared[0]}` : `${shared.length} minat sama: ${shared.slice(0, 2).join(", ")}`}
          </p>
        ) : null}
        {candidate.interests.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {candidate.interests.slice(0, 8).map((i) => (
              <span
                key={i}
                className="shrink-0 rounded-[999px] border border-line px-2.5 py-1 text-2xs font-medium capitalize text-ink-soft"
              >
                {i.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onOpenProfile}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-line bg-paper-2/60 text-xs font-bold text-ink transition-colors hover:bg-paper-2"
        >
          Lihat profil lengkap
          <Icon name="chevron" className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>

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

      <div className="grid grid-cols-4 place-items-center gap-1 border-t border-line bg-paper px-3 py-2.5">
        <button
          type="button"
          onClick={() => void fly("pass")}
          disabled={busy || flying}
          aria-label="Lewati"
          className="grid h-14 w-14 place-items-center rounded-[999px] border border-line-strong bg-paper text-ink transition-transform duration-150 active:scale-95 disabled:opacity-50"
        >
          <Icon name="x" className="h-6 w-6" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={busy || flying || !canUndo}
          aria-label="Batalkan swipe terakhir"
          className="grid h-14 w-14 place-items-center rounded-[999px] border border-line-strong bg-paper text-ink-soft transition-transform duration-150 active:scale-95 disabled:border-line disabled:bg-paper-2 disabled:text-ink-faint"
        >
          <Icon name="undo" className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => void fly("superlike")}
          disabled={busy || flying || superLeft <= 0}
          aria-label={`Superlike, sisa ${superLeft} hari ini`}
          title={`Superlike · sisa ${superLeft} hari ini`}
          className="relative grid h-14 w-14 place-items-center rounded-[999px] border border-line-strong bg-paper text-ink transition-transform duration-150 active:scale-95 disabled:opacity-50"
        >
          <Icon name="star" className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.6rem] font-bold tabular-nums text-paper ring-2 ring-paper">
            {superLeft}
          </span>
        </button>
        <button
          type="button"
          onClick={() => void fly("like")}
          disabled={busy || flying}
          aria-label="Suka"
          className="grid h-14 w-14 place-items-center rounded-[999px] bg-blush-deep text-paper shadow-[0_12px_28px_-14px_oklch(0.49_0.185_20)] transition-transform duration-150 active:scale-95 disabled:opacity-50"
        >
          <Icon name="heart" className="h-6 w-6" filled />
        </button>
      </div>
    </motion.article>
  );
}

export default function SwipeDeck({
  candidates,
  likesUsed,
  dailyLikes,
  superlikesLeft,
  isVerified,
  hasSwipes,
  gold,
  myInterests,
  prefs,
}: {
  candidates: Candidate[];
  likesUsed: number;
  dailyLikes: number;
  superlikesLeft: number;
  isVerified: boolean;
  hasSwipes: boolean;
  gold: boolean;
  myInterests?: string[];
  prefs: {
    min_age: number;
    max_age: number;
    max_distance_km: number;
    show_gender: string[];
    verified_only: boolean;
    search_lat: number | null;
    search_lng: number | null;
  };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [index, setIndex] = useState(0);
  const [used, setUsed] = useState(likesUsed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<{ matchId: string; name: string; candidate: Candidate } | null>(null);
  const [reportFor, setReportFor] = useState<Candidate | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [canUndo, setCanUndo] = useState(hasSwipes);
  const [superLeft, setSuperLeft] = useState(superlikesLeft);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCandidate, setSheetCandidate] = useState<Candidate | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const current = candidates[index];
  const unlimited = dailyLikes >= 100000;
  const likesLeft = unlimited ? Infinity : Math.max(0, dailyLikes - used);

  const decide = useCallback(
    async (action: Action) => {
      const target = candidates[index];
      if (!target) return false;
      if (action === "superlike" && superLeft <= 0) {
        setError("Superlike hari ini habis. Blush Plus memberi 5 per hari, Gold 10.");
        return false;
      }
      if (action !== "pass" && !unlimited && likesLeft <= 0) {
        setError("Kuota like hari ini habis. Naikkan paket untuk swipe tanpa batas, atau kembali besok.");
        return false;
      }
      setBusy(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sesi habis, masuk ulang.");
        setBusy(false);
        return false;
      }
      const { error: insErr } = await supabase
        .from("swipes")
        .insert({ actor_id: user.id, target_id: target.id, action });
      if (insErr && !insErr.message.includes("duplicate")) {
        setError("Swipe belum tersimpan. Coba sekali lagi.");
        setBusy(false);
        return false;
      }
      // Baru geser kartu setelah swipe benar-benar tersimpan.
      setIndex((i) => i + 1);
      if (action !== "pass") setUsed((u) => u + 1);
      if (action === "superlike") setSuperLeft((n) => Math.max(0, n - 1));
      setCanUndo(true);

      if (action !== "pass") {
        void fetch("/api/push/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetId: target.id }),
        }).catch(() => {});
        const { data: myMatches } = await supabase.rpc("my_matches");
        const match = (myMatches ?? []).find(
          (m: { match_id: string; other_id: string }) => m.other_id === target.id,
        );
        if (match?.match_id) setMatched({ matchId: match.match_id, name: target.display_name || "Seseorang", candidate: target });
      }
      setBusy(false);
      return true;
    },
    [candidates, index, unlimited, likesLeft, superLeft, supabase],
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
    // Kandidat yang dibatalkan belum pernah di-like, jadi kandidat itu muncul lagi di depan.
    setIndex(0);
    setUsed((u) => Math.max(0, u - 1));
    setError(null);
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
    <div className="mx-auto w-full max-w-md lg:max-w-[772px]">
      <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="shrink-0 text-lg font-bold tracking-[-0.01em]">Untukmu</h1>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex min-h-11 items-center gap-1 rounded-[999px] border border-line-strong px-3 text-xs font-bold text-ink transition-colors hover:border-ink hover:bg-paper-2"
          >
            <Icon name="filter" className="h-3.5 w-3.5" />
            Filter
          </button>
          <span
            className={`whitespace-nowrap text-2xs font-semibold ${
              likesLeft === 0 ? "text-blush-deep" : "text-ink-soft"
            }`}
          >
            {unlimited ? (
              "Tanpa batas"
            ) : (
              <span className="whitespace-nowrap">
                Sisa <CountUp value={likesLeft} /> like
              </span>
            )}
          </span>
          </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,440px)_minmax(0,300px)] lg:gap-8">
        <div className="min-w-0">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-3 bottom-0 top-2 -z-10 rounded-[20px] border border-line bg-paper-2" aria-hidden="true" />
          {current ? (
            <SwipeCard
              key={current.id}
              candidate={current}
              busy={busy}
              onDecide={decide}
              onUndo={undo}
              canUndo={canUndo}
              superLeft={superLeft}
              onReport={() => setReportFor(current)}
              onBlock={() => void block(current)}
              onOpenProfile={() => {
                              setSheetCandidate(current ?? null);
                              setSheetOpen(true);
                            }}
              myInterests={myInterests}
            />
          ) : null}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {!current ? (
            <div className="grid min-h-[52dvh] place-items-center rounded-[20px] border border-line bg-paper px-5 py-8">
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-[999px] bg-paper-3 text-ink-soft">
                  <Icon name="heart" className="h-7 w-7" />
                </span>
                <h2 className="mt-3 text-lg">Belum ada yang baru</h2>
                <p className="mx-auto mt-1 max-w-[18rem] text-sm text-ink-soft">
                  Belum ada kandidat baru di jarak dan umur yang kamu pilih. Longgarkan filternya, lalu muat ulang.
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
            <span className="text-ink-soft">Kandidat tersisa</span>
            <span className="font-bold">{candidates.length}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-ink-soft">Like dikirim</span>
            <span className="font-bold tabular-nums">{used}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-ink-soft">Batas harian</span>
            <span className="font-bold">{unlimited ? "Tanpa batas" : `${dailyLikes}`}</span>
          </div>
        </div>

        <Link href="/app/premium" className="rounded-[18px] bg-blush-deep p-4 text-paper">
          <p className="text-sm font-bold">Blush Plus</p>
          <p className="mt-1 text-xs text-paper/95">Swipe tanpa batas, lihat siapa yang sudah suka duluan, 5 superlike per hari.</p>
          <span className="mt-3 inline-flex items-center gap-1 rounded-[999px] bg-paper px-3 py-1.5 text-xs font-bold text-ink">
            Lihat paket
            <Icon name="chevron" className="h-3.5 w-3.5" strokeWidth={2.4} />
          </span>
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
      </div>

      <ProfileSheet
        candidate={sheetCandidate ?? current ?? null}
        open={sheetOpen}
        superLeft={superLeft}
        busy={busy}
        onClose={() => {
          setSheetOpen(false);
          setSheetCandidate(null);
        }}
        onDecide={(action) => void decide(action)}
        onReport={() => {
          setSheetOpen(false);
          setReportFor(sheetCandidate ?? current ?? null);
          setSheetCandidate(null);
        }}
        onBlock={() => {
          setSheetOpen(false);
          const target = sheetCandidate ?? current;
          setSheetCandidate(null);
          if (target) void block(target);
        }}
      />

      <FiltersSheet open={filtersOpen} prefs={prefs} gold={gold} onClose={() => setFiltersOpen(false)} />

      <MatchModal
        matched={matched}
        onClose={() => setMatched(null)}
        onViewProfile={() => {
          if (!matched) return;
          setSheetCandidate(matched.candidate);
          setMatched(null);
          setSheetOpen(true);
        }}
      />

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

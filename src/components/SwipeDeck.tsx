"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { distanceLabel, photoUrl } from "@/lib/photo";
import { MatchModal, ReportModal } from "@/components/DeckModals";
import { btnDanger, btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

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
};

type Action = "like" | "pass" | "superlike";

const REPORT_REASONS = ["Profil palsu", "Foto tidak pantas", "Spam / jualan", "Kasar atau melecehkan", "Di bawah umur"];

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
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<{ matchId: string; name: string } | null>(null);
  const [reportFor, setReportFor] = useState<Candidate | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const start = useRef({ x: 0, y: 0 });

  const current = candidates[index];
  const unlimited = dailyLikes >= 100000;
  const likesLeft = unlimited ? Infinity : Math.max(0, dailyLikes - used);
  const photo = useMemo(() => photoUrl(current?.photos?.[0]), [current]);

  async function record(action: Action, target: Candidate) {
    setBusy(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesi habis, masuk ulang.");
      setBusy(false);
      return;
    }
    if (action !== "pass" && !unlimited && likesLeft <= 0) {
      setError("Kuota like hari ini habis. Besok direset, atau naikkan paket untuk swipe tanpa batas.");
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
    if (action !== "pass") setUsed((u) => u + 1);

    // Cek apakah like timbal balik baru membuat match (dibuat oleh trigger di DB).
    const { data: myMatches } = await supabase.rpc("my_matches");
    const match = (myMatches ?? []).find(
      (m: { match_id: string; other_id: string }) => m.other_id === target.id,
    );

    setBusy(false);
    setIndex((i) => i + 1);
    setDrag({ x: 0, y: 0, active: false });
    if (match?.match_id && action !== "pass") {
      setMatched({ matchId: match.match_id, name: target.display_name || "Seseorang" });
    }
  }

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
    setError("Laporan terkirim. Terima kasih — profil ini masuk antrean review.");
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

  function onPointerDown(e: React.PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.active) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  }

  function onPointerUp() {
    if (!drag.active || !current) return;
    const { x, y } = drag;
    if (y < -110 && Math.abs(x) < 90) void record("superlike", current);
    else if (x > 100) void record("like", current);
    else if (x < -100) void record("pass", current);
    else setDrag({ x: 0, y: 0, active: false });
  }

  if (!current) {
    return (
      <>
        <div className="rounded-card border border-line bg-paper p-[var(--space-lg)]">
          <h2 className="text-2xl">Deck kosong</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Tidak ada profil yang lolos filtermu sekarang. Perlebar jarak atau umur di preferensi, atau cek lagi nanti
            — deck diisi ulang dari profil yang aktif.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/profile" className={btnGhost}>
              Ubah preferensi
            </Link>
            <button type="button" className={btnPrimary} onClick={() => router.refresh()}>
              Muat ulang deck
            </button>
          </div>
          {error ? <p className="mt-3 text-sm font-medium text-blush-deep">{error}</p> : null}
        </div>
        <MatchModal matched={matched} onClose={() => setMatched(null)} />
      </>
    );
  }

  const tilt = Math.max(-8, Math.min(8, drag.x / 18));

  return (
    <div className="grid gap-[var(--space-lg)] md:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div>
        <div className="mb-[var(--space-sm)] flex items-center justify-between text-xs font-semibold text-ink-soft">
          <span>Kandidat {index + 1} dari {candidates.length}</span>
          <span>{unlimited ? "Swipe tanpa batas" : `Sisa ${likesLeft} like hari ini`}</span>
        </div>

        <article
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="touch-none select-none overflow-hidden rounded-card border border-line bg-paper shadow-[0_16px_40px_-28px_oklch(0.62_0.2_15)]"
          style={{
            transform: `translate(${drag.x}px, ${drag.y}px) rotate(${tilt}deg)`,
            transition: drag.active ? "none" : "transform var(--dur-base) var(--ease-out)",
          }}
        >
          <div className="flex h-[320px] items-center justify-center bg-blush-tint">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={`Foto ${current.display_name}`} className="h-full w-full object-cover" draggable={false} />
            ) : (
              <span className="text-sm font-semibold text-blush-deep">Belum ada foto</span>
            )}
          </div>
          <div className="p-[var(--space-md)]">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-2xl">{current.display_name || "Tanpa nama"}</h2>
              {current.age ? <span className="text-sm text-ink-soft">{current.age}</span> : null}
              {current.is_verified === "approved" ? (
                <span className="rounded-[999px] bg-ok px-2 py-0.5 text-2xs font-semibold text-paper">Terverifikasi</span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {current.city || "Kota belum diisi"} · {distanceLabel(current.distance_m)}
            </p>
            {current.bio ? <p className="mt-3 text-sm text-ink-soft">{current.bio}</p> : null}
            {current.interests.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1">
                {current.interests.map((i) => (
                  <span key={i} className="rounded-[999px] border border-line px-2 py-0.5 text-2xs text-ink-soft">
                    {i}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>

        <div className="mt-[var(--space-md)] flex flex-wrap items-center gap-2">
          <button type="button" className={btnGhost} onClick={() => record("pass", current)} disabled={busy}>
            Lewati
          </button>
          <button type="button" className={btnPrimary} onClick={() => record("like", current)} disabled={busy}>
            Suka
          </button>
          <button type="button" className={btnGhost} onClick={() => record("superlike", current)} disabled={busy}>
            Superlike
          </button>
          <button type="button" className={btnGhost} onClick={undo} disabled={busy}>
            Undo
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          Geser kanan untuk suka, kiri untuk lewati, atau tarik ke atas untuk superlike.
        </p>

        {error ? <p className="mt-3 text-sm font-medium text-blush-deep">{error}</p> : null}
      </div>

      <aside className="flex flex-col gap-[var(--space-md)]">
        <div className="rounded-card border border-line bg-paper-2 p-[var(--space-md)]">
          <span className="text-2xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Keamanan profil ini</span>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={btnDanger} onClick={() => setReportFor(current)}>
              Laporkan
            </button>
            <button type="button" className={btnGhost} onClick={() => block(current)} disabled={busy}>
              Block
            </button>
          </div>
        </div>

        {!isVerified ? (
          <div className="rounded-card border border-line bg-paper p-[var(--space-md)]">
            <span className="text-2xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Badge kamu</span>
            <p className="mt-2 text-sm text-ink-soft">
              Akunmu belum terverifikasi. Kirim selfie sekali dan badge terverifikasi akan muncul di profilmu.
            </p>
            <Link href="/app/profile" className={`${btnPrimary} mt-3`}>
              Kirim verifikasi
            </Link>
          </div>
        ) : null}

        <div className="rounded-card border border-line bg-paper-2 p-[var(--space-md)]">
          <span className="text-2xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Cuplikan perilaku</span>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            <li>Profil di deck: {candidates.length}</li>
            <li>Like terpakai hari ini: {unlimited ? `${used} (tanpa batas)` : `${used} / ${dailyLikes}`}</li>
          </ul>
        </div>
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

type Message = {
  id: number;
  sender_id: string;
  body: string;
  created_at: string;
};

const REPORT_REASONS = ["Kasar atau melecehkan", "Spam / promosi", "Meminta uang", "Ajakan tidak pantas", "Lainnya"];

export default function Chat({
  matchId,
  meId,
  otherId,
  otherName,
}: {
  matchId: string;
  meId: string;
  otherId: string;
  otherName: string;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("match_id", matchId)
        .order("created_at");
      if (!alive) return;
      if (error) setStatus(error.message);
      setMessages((data ?? []) as Message[]);
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("match_id", matchId)
        .neq("sender_id", meId)
        .is("read_at", null);
    })();

    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [matchId, meId, supabase]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const grouped = useMemo(() => messages, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    setStatus(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setStatus("Sesi habis, masuk ulang.");
      return;
    }
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: user.id, body: text })
      .select("id, sender_id, body, created_at")
      .single();
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    // Pesan yang baru masuk ditambahkan langsung ke daftar; event realtime hanya untuk pesan lawan bicara.
    setMessages((prev) => (prev.some((m) => m.id === inserted.id) ? prev : [...prev, inserted as Message]));
    setBody("");
  }

  async function block() {
    setBusy(true);
    const { error } = await supabase.from("blocks").insert({ blocker_id: meId, blocked_id: otherId });
    setBusy(false);
    setStatus(error ? error.message : "Pengguna diblokir. Kalian tidak akan muncul satu sama lain lagi.");
    setShowSafety(false);
  }

  async function report() {
    setBusy(true);
    const { error } = await supabase
      .from("reports")
      .insert({ reporter_id: meId, reported_id: otherId, reason, details: null });
    setBusy(false);
    setStatus(error ? error.message : "Laporan terkirim ke antrean review.");
    setShowSafety(false);
  }

  async function unmatch() {
    setBusy(true);
    const { error } = await supabase
      .from("matches")
      .update({ unmatched_by: meId })
      .eq("id", matchId);
    setBusy(false);
    setConfirmUnmatch(false);
    setStatus(error ? error.message : "Match dibatalkan. Room ini tidak lagi aktif.");
  }

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col rounded-card border border-line bg-paper md:h-[calc(100dvh-7.5rem)]">
      <header className="flex items-center justify-between gap-2 border-b border-line px-[var(--space-md)] py-[var(--space-sm)]">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/app/matches"
            aria-label="Kembali ke daftar chat"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[999px] border border-line-strong text-ink transition-colors hover:border-ink hover:bg-paper-2"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <p className="truncate font-semibold">{otherName || "Tanpa nama"}</p>
            <p className="text-2xs font-semibold text-ink-soft">Saling suka</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex min-h-10 items-center rounded-[999px] border border-line-strong px-3.5 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-paper-2"
            onClick={() => setShowSafety((s) => !s)}
          >
            Keamanan
          </button>
        </div>
      </header>

      {showSafety ? (
        <div className="border-b border-line bg-paper-2 p-[var(--space-md)]">
          <span className={label}>Tindakan</span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select className={inputBase + " max-w-xs"} value={reason} onChange={(e) => setReason(e.target.value)}>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button type="button" className={btnGhost} onClick={report} disabled={busy}>
              Laporkan
            </button>
            <button type="button" className={btnGhost} onClick={block} disabled={busy}>
              Block
            </button>
            <button type="button" className={btnGhost} onClick={() => setConfirmUnmatch(true)} disabled={busy}>
              Batalkan match
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex-1 space-y-2 overflow-y-auto px-[var(--space-md)] py-[var(--space-md)]">
        {grouped.length === 0 ? (
          <p className="text-sm text-ink-soft">Belum ada pesan. Mulai dari hal kecil: kopi, film, atau rencana akhir pekan.</p>
        ) : null}
        {grouped.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <p
                className={`max-w-[80%] rounded-[12px] px-3 py-2 text-sm ${
                  mine ? "bg-blush-deep text-paper" : "border border-line bg-paper-2 text-ink"
                }`}
              >
                {m.body}
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {status ? <p className="px-[var(--space-md)] pb-2 text-sm font-medium text-blush-deep">{status}</p> : null}

      <form onSubmit={send} className="flex gap-2 border-t border-line p-[var(--space-sm)]">
        <input
          className={inputBase}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tulis pesan…"
          aria-label="Pesan"
          maxLength={2000}
        />
        <button type="submit" className={btnPrimary} disabled={busy}>
          Kirim
        </button>
      </form>

      {confirmUnmatch ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-[var(--space-md)]">
          <div className="w-full max-w-sm rounded-card border border-line bg-paper p-[var(--space-lg)]">
            <h2 className="text-xl">Batalkan match dengan {otherName || "pengguna ini"}?</h2>
            <p className="mt-2 text-sm text-ink-soft">Room chat akan ditutup untuk kalian berdua.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className={btnPrimary} onClick={unmatch} disabled={busy}>
                Ya, batalkan
              </button>
              <button type="button" className={btnGhost} onClick={() => setConfirmUnmatch(false)}>
                Tidak
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { btnGhost, btnPrimary } from "@/components/ui";
import { formatClock, formatDayLabel, formatRelative, sameDay } from "@/lib/time";
import AudioCall from "@/components/AudioCall";

type Message = {
  id: number;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  pending?: boolean;
  failed?: boolean;
};

const REPORT_REASONS = ["Kasar atau melecehkan", "Spam atau promosi", "Minta uang", "Ajakan tidak pantas", "Lainnya"];
const GROUP_WINDOW_MS = 5 * 60_000;
const EMOJIS = ["😀", "😂", "🥰", "😍", "😘", "😊", "😎", "🤍", "❤️", "🔥", "👏", "🙌", "👍", "🤔", "😅", "😭", "😤", "💬", "🎉", "☕", "🍜", "🌙", "✨", "💫"];

function sameGroup(a: Message, b: Message) {
  return (
    a.sender_id === b.sender_id &&
    sameDay(a.created_at, b.created_at) &&
    Math.abs(+new Date(b.created_at) - +new Date(a.created_at)) < GROUP_WINDOW_MS
  );
}

export default function Chat({
  matchId,
  meId,
  otherId,
  otherName,
  otherPhoto,
  otherActiveAt,
  expiresAt,
  extendedAt,
  sharedInterests = [],
}: {
  matchId: string;
  meId: string;
  otherId: string;
  otherName: string;
  otherPhoto: string | null;
  otherActiveAt: string | null;
  expiresAt: string | null;
  extendedAt: string | null;
  sharedInterests?: string[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSafety, setShowSafety] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [liveActiveAt, setLiveActiveAt] = useState<string | null>(otherActiveAt);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [expiry, setExpiry] = useState<string | null>(expiresAt);
  const [extended, setExtended] = useState(Boolean(extendedAt));
  const [extendBusy, setExtendBusy] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const peerTimer = useRef<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingSentAt = useRef(0);
  const scrollOnNext = useRef(true);

  const scrollToEnd = useCallback((smooth = true) => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: smooth && !reduce ? "smooth" : "auto", block: "end" });
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at, read_at")
        .eq("match_id", matchId)
        .order("created_at");
      if (!alive) return;
      if (error) setStatus({ tone: "error", text: "Pesan lama gagal dimuat. Coba muat ulang halaman." });
      setMessages((data ?? []) as Message[]);
      setLoading(false);
      scrollOnNext.current = true;
      scrollToEnd(false);
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
          scrollOnNext.current = true;
          if (msg.sender_id !== meId) {
            setPeerTyping(false);
            void supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", msg.id)
              .is("read_at", null);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read_at: msg.read_at ?? m.read_at } : m)));
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!payload || payload.userId === meId) return;
        setPeerTyping(true);
        if (peerTimer.current) window.clearTimeout(peerTimer.current);
        peerTimer.current = window.setTimeout(() => setPeerTyping(false), 3200);
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      alive = false;
      if (peerTimer.current) window.clearTimeout(peerTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [matchId, meId, supabase, scrollToEnd]);

  useEffect(() => {
    if (scrollOnNext.current) {
      scrollOnNext.current = false;
      scrollToEnd(messages.length > 0 && !loading);
    }
  }, [messages, loading, scrollToEnd]);

  useEffect(() => {
    const channel = supabase
      .channel(`presence-${otherId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${otherId}` },
        (payload) => {
          const next = (payload.new as { last_active_at?: string | null }).last_active_at ?? null;
          setLiveActiveAt(next);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [otherId, supabase]);

  // Relatif time ("Aktif 3 menit lalu") harus ikut berjalan tanpa reload.
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!showSafety && !confirmUnmatch) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowSafety(false);
        setConfirmUnmatch(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSafety, confirmUnmatch]);

  const lastMine = useMemo(
    () => [...messages].reverse().find((m) => m.sender_id === meId && !m.pending && !m.failed),
    [messages, meId],
  );

  function resize() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  function insertEmoji(emoji: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const next = body.slice(0, start) + emoji + body.slice(end);
    setBody(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + emoji.length, start + emoji.length);
      resize();
    });
  }

  function onType(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value);
    resize();
    const now = Date.now();
    if (e.target.value.trim() && now - typingSentAt.current > 900) {
      typingSentAt.current = now;
      // Kirim di channel yang sudah subscribe; channel baru tidak akan terkirim.
      void channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: meId },
      });
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;

    setStatus(null);
    setBusy(true);
    const tempId = -Date.now();
    const optimistic: Message = {
      id: tempId,
      sender_id: meId,
      body: text,
      created_at: new Date().toISOString(),
      read_at: null,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    scrollOnNext.current = true;

    const { data: who } = await supabase.auth.getUser();
    if (!who.user) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setBody(text);
      setStatus({ tone: "error", text: "Sesi kamu habis. Masuk ulang, lalu kirim lagi." });
      setBusy(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: who.user.id, body: text })
      .select("id, sender_id, body, created_at, read_at")
      .single();

    setBusy(false);
    if (error || !inserted) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
      setStatus({ tone: "error", text: "Pesan belum terkirim. Cek koneksi, lalu coba lagi." });
      return;
    }

    setMessages((prev) => {
      const withoutTemp = prev.filter((m) => m.id !== tempId);
      return withoutTemp.some((m) => m.id === (inserted as Message).id)
        ? withoutTemp
        : [...withoutTemp, inserted as Message];
    });
    void fetch("/api/push/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, text }),
    }).catch(() => {});
  }

  function retry(m: Message) {
    if (!m.failed) return;
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    setBody(m.body);
    inputRef.current?.focus();
  }

  async function block() {
    setBusy(true);
    const { error } = await supabase.from("blocks").insert({ blocker_id: meId, blocked_id: otherId });
    setBusy(false);
    setShowSafety(false);
    if (!error) {
      router.push("/app/matches");
      router.refresh();
      return;
    }
    setStatus({ tone: "error", text: "Blokir gagal. Coba lagi sebentar lagi." });
  }

  async function report() {
    setBusy(true);
    const { error } = await supabase
      .from("reports")
      .insert({ reporter_id: meId, reported_id: otherId, reason, details: null });
    setBusy(false);
    setShowSafety(false);
    setStatus({
      tone: error ? "error" : "ok",
      text: error ? "Laporan gagal terkirim. Coba lagi." : "Laporan masuk. Dia tidak mendapat notifikasi soal ini.",
    });
  }

  async function extend() {
    setExtendBusy(true);
    const { data, error: err } = await supabase.rpc("extend_match", { p_match: matchId });
    setExtendBusy(false);
    if (err) {
      setStatus({ tone: "error", text: "Chat belum bisa diperpanjang. Coba lagi." });
      return;
    }
    if (typeof data === "string") setExpiry(data);
    setExtended(true);
    setStatus({ tone: "ok", text: "Chat diperpanjang 24 jam. Waktu baru terpasang." });
  }

  async function unmatch() {
    setBusy(true);
    const { error } = await supabase.from("matches").update({ unmatched_by: meId }).eq("id", matchId);
    setBusy(false);
    setConfirmUnmatch(false);
    if (!error) {
      router.push("/app/matches");
      router.refresh();
      return;
    }
    setStatus({ tone: "error", text: "Match gagal dibatalkan. Coba lagi." });
  }

  const sinceActive = liveActiveAt ? nowMs - new Date(liveActiveAt).getTime() : Number.POSITIVE_INFINITY;
  const activeNow = Boolean(liveActiveAt) && sinceActive < 5 * 60_000;
  const activeShort = !liveActiveAt
    ? ""
    : sinceActive < 3_600_000
      ? `${Math.max(1, Math.floor(sinceActive / 60_000))}m`
      : sinceActive < 86_400_000
        ? `${Math.floor(sinceActive / 3_600_000)}j`
        : `${Math.floor(sinceActive / 86_400_000)}h`;
  const statusLine = !liveActiveAt
    ? "Saling suka"
    : activeNow
      ? "Aktif sekarang"
      : `Aktif ${activeShort}`;

  return (
    <div className="flex h-[calc(100dvh-10.75rem)] flex-col overflow-hidden bg-paper md:h-[calc(100dvh-7.5rem)] md:rounded-card md:border md:border-line">
      <header className="flex items-center gap-2 border-b border-line px-2.5 py-2">
        <Link
          href="/app/matches"
          aria-label="Kembali ke daftar chat"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink hover:bg-paper-2"
        >
          <Icon name="back" className="h-5 w-5" />
        </Link>
        <div className="relative h-11 w-11 shrink-0">
          <div className="h-11 w-11 overflow-hidden rounded-full bg-paper-2">
            {otherPhoto ? <img src={otherPhoto} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          {activeNow ? <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-ok ring-2 ring-paper" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[0.95rem] font-bold leading-tight tracking-[-0.01em]">{otherName || "Tanpa nama"}</p>
          <p
            className={`truncate text-xs leading-tight ${peerTyping ? "font-semibold text-blush-deep" : "text-ink-soft"}`}
            aria-live="polite"
          >
            {peerTyping ? "sedang menulis…" : statusLine}
          </p>
        </div>
        <AudioCall matchId={matchId} meId={meId} otherName={otherName} />
        <button
          type="button"
          aria-label="Opsi dan keamanan"
          aria-expanded={showSafety}
          onClick={() => setShowSafety((s) => !s)}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${
            showSafety
              ? "border-blush-deep bg-blush-tint text-blush-deep"
              : "border-line-strong text-ink hover:border-ink hover:bg-paper-2"
          }`}
        >
          <Icon name="more" className="h-5 w-5" />
        </button>
      </header>

      {showSafety ? (
        <section className="border-b border-line bg-paper-2 px-3 py-3" aria-label="Keamanan">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold">Keamanan</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Laporkan, blokir, atau batalkan match. Dia tidak mendapat notifikasi soal laporan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSafety(false)}
              aria-label="Tutup panel keamanan"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-paper-3 hover:text-ink"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <select
              className="h-11 min-w-0 flex-1 rounded-[12px] border border-line-input bg-paper px-3 text-sm text-ink"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-label="Alasan laporan"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button type="button" className={`${btnGhost} shrink-0 px-4`} onClick={report} disabled={busy}>
              Laporkan
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" className={`${btnGhost} flex-1`} onClick={block} disabled={busy}>
              Blokir
            </button>
            <button type="button" className={`${btnGhost} flex-1`} onClick={() => setConfirmUnmatch(true)} disabled={busy}>
              Batalkan match
            </button>
          </div>
        </section>
      ) : null}

      {expiry ? (() => {
        const left = Math.max(0, new Date(expiry).getTime() - nowMs);
        const hours = Math.floor(left / 3_600_000);
        const expired = left === 0;
        return (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper-2 px-3 py-2 text-xs">
            <span className={expired ? "font-semibold text-blush-deep" : "text-ink-soft"}>
              {expired ? "Waktu chat habis" : `Chat ditutup dalam ${hours > 0 ? `${hours} jam` : `${Math.max(1, Math.floor(left / 60_000))} menit`}`}
            </span>
            {!extended && !expired ? (
              <button
                type="button"
                onClick={extend}
                disabled={extendBusy}
                className="inline-flex min-h-8 items-center gap-1 rounded-[999px] border border-line-strong px-3 text-xs font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60"
              >
                <Icon name="clock" className="h-3.5 w-3.5" />
                {extendBusy ? "Memperpanjang…" : "Perpanjang 24 jam"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-ok">
                <Icon name="check" className="h-3.5 w-3.5" /> sudah diperpanjang
              </span>
            )}
          </div>
        );
      })() : null}

      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-3" aria-live="polite">
        {loading ? (
          <div className="space-y-2" aria-hidden>
            <div className="h-9 w-2/3 animate-pulse rounded-[16px] bg-paper-2" />
            <div className="ml-auto h-9 w-1/2 animate-pulse rounded-[16px] bg-paper-2" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-paper-3 text-ink-soft">
              <Icon name="chat" className="h-6 w-6" />
            </div>
            <p className="mt-3 font-display text-lg font-bold">Belum ada pesan</p>
            <p className="mt-1 max-w-[16rem] text-sm text-ink-soft">
              Sebut satu hal dari profilnya. Biasanya itu cukup buat mulai.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {(sharedInterests.length ? sharedInterests.slice(0, 3).map((tag) => `Kalian sama-sama suka ${tag.toLowerCase()}. Tanya favoritnya?`) : [
                "Apa hal kecil yang bikin harimu enak?",
                "Lagi pengin ke tempat baru, di mana?",
                "Coffee atau teh, dan kenapa?",
              ]).map((line) => (
                <button
                  key={line}
                  type="button"
                  onClick={() => {
                    setBody(line);
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                  className="rounded-[999px] border border-line bg-paper px-3 py-1.5 text-left text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-paper-2"
                >
                  {line}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-auto">
          {messages.map((m, i) => {
            const mine = m.sender_id === meId;
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const start = !prev || !sameGroup(prev, m);
            const end = !next || !sameGroup(m, next);
            const day = !prev || !sameDay(prev.created_at, m.created_at);
            const mineRead = mine && m.id === lastMine?.id;
            const bubbleShape = mine
              ? `rounded-[18px] ${start ? "rounded-tr-[6px]" : ""} ${end ? "rounded-br-[6px]" : ""}`
              : `rounded-[18px] ${start ? "rounded-tl-[6px]" : ""} ${end ? "rounded-bl-[6px]" : ""}`;

            return (
              <div key={m.id}>
                {day ? (
                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-line-strong" />
                    <span className="text-[0.7rem] font-semibold text-ink-soft">{formatDayLabel(m.created_at)}</span>
                    <span className="h-px flex-1 bg-line-strong" />
                  </div>
                ) : null}
                <div className={`flex ${mine ? "justify-end" : "justify-start"} ${end ? "mb-3" : "mb-0.5"}`}>
                  <div className={`flex max-w-[80%] flex-col ${mine ? "items-end" : "items-start"}`}>
                    <div
                      className={`blush-bubble-in px-3 py-2 text-sm leading-[1.45] ${bubbleShape} ${
                        mine
                          ? m.failed
                            ? "border border-line-strong bg-paper-2 text-ink"
                            : "bg-blush-deep text-paper"
                          : "border border-line bg-paper-2 text-ink"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words [text-wrap:pretty]">{m.body}</p>
                    </div>
                    {end ? (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[0.7rem] font-medium leading-none text-ink-soft">
                        {m.failed ? (
                          <button type="button" onClick={() => retry(m)} className="font-semibold text-blush-deep underline">
                            Gagal · Coba lagi
                          </button>
                        ) : m.pending ? (
                          <span>Mengirim…</span>
                        ) : (
                          <>
                            <span className="tabular-nums">{formatClock(m.created_at)}</span>
                            {mineRead ? (
                              m.read_at ? (
                                <>
                                  <Icon name="checks" className="h-3.5 w-3.5 text-blush-deep" strokeWidth={2.2} />
                                  <span className="sr-only">Sudah dibaca</span>
                                </>
                              ) : (
                                <>
                                  <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.2} />
                                  <span className="sr-only">Terkirim</span>
                                </>
                              )
                            ) : null}
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          {peerTyping ? (
          <div className="mb-2 flex justify-start" aria-label={`${otherName || "Dia"} sedang menulis`}>
            <div className="flex items-center gap-1 rounded-[18px] rounded-bl-[6px] border border-line bg-paper-2 px-3 py-2.5">
              {[0, 1, 2].map((n) => (
                <span
                  key={n}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-soft"
                  style={{ animationDelay: `${n * 140}ms` }}
                />
              ))}
            </div>
          </div>
        ) : null}
          <div ref={endRef} />
          </div>
        )}
      </div>

      {status ? (
        <p
          role="status"
          className={`px-3 pb-1 text-xs font-medium ${status.tone === "error" ? "text-blush-deep" : "text-ink-soft"}`}
        >
          {status.text}
        </p>
      ) : null}

      <form onSubmit={send} className="relative border-t border-line p-2">
        {emojiOpen ? (
          <div className="blush-pop-in absolute bottom-[calc(100%-4px)] right-2 z-30 w-[min(18rem,calc(100vw-2rem))] rounded-[18px] border border-line bg-paper p-2 shadow-[0_18px_50px_-20px_rgba(32,26,20,0.45)]" role="dialog" aria-label="Pilih emoji">
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="grid h-9 w-9 place-items-center rounded-[9px] text-xl transition-colors hover:bg-paper-2 focus-visible:bg-paper-2" aria-label={`Sisipkan ${emoji}`}>
                  {emoji}
                </button>
              ))}
            </div>
            <p className="mt-1 px-1 text-[10px] leading-4 text-ink-soft">Emoji mengikuti sistem perangkat. Di iPhone tampil gaya Apple.</p>
          </div>
        ) : null}
        <div className="flex items-end gap-1.5 rounded-[22px] border border-line-input bg-paper px-2 py-1.5 transition-colors focus-within:border-blush-deep">
          <textarea
            ref={inputRef}
            rows={1}
            value={body}
            onChange={onType}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(e);
              }
            }}
            placeholder="Tulis pesan…"
            aria-label="Pesan"
            maxLength={2000}
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm leading-snug text-ink outline-none placeholder:text-ink-placeholder"
          />
          <button
            type="button"
            aria-label="Buka emoji"
            aria-expanded={emojiOpen}
            onClick={() => setEmojiOpen((open) => !open)}
            className={`mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors ${emojiOpen ? "bg-paper-3 text-ink" : "text-ink-soft hover:bg-paper-2 hover:text-ink"}`}
          >
            <Icon name="smile" className="h-[19px] w-[19px]" />
          </button>
          <button
            type="submit"
            disabled={!body.trim() || busy}
            aria-label="Kirim pesan"
            className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush-deep text-paper transition-all disabled:cursor-not-allowed disabled:bg-paper-3 disabled:text-ink-faint disabled:opacity-50"
          >
            <Icon name="send" className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between px-1 text-[0.65rem] text-ink-faint">
          <span className="hidden sm:block">Enter buat kirim · Shift + Enter baris baru</span>
          <span className="ml-auto tabular-nums">{body.length > 1800 ? `${body.length}/2000` : ""}</span>
        </div>
      </form>

      {confirmUnmatch ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-[var(--space-md)]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unmatch-title"
            className="w-full max-w-sm rounded-card border border-line bg-paper p-[var(--space-lg)]"
          >
            <h2 id="unmatch-title" className="text-xl">
              Batalkan match dengan {otherName || "dia"}?
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Chat ditutup untuk kalian berdua dan tidak bisa dibuka lagi.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className={btnPrimary} onClick={unmatch} disabled={busy}>
                Batalkan match
              </button>
              <button type="button" className={btnGhost} onClick={() => setConfirmUnmatch(false)} disabled={busy}>
                Batal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

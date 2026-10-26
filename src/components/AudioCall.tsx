"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

type Phase = "idle" | "calling" | "incoming" | "connecting" | "active" | "error";
type Signal = { callId: string; from: string };
type Incoming = Signal & { name?: string };

const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

function secondsLabel(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Panggilan suara WebRTC di dalam room chat. Penelepon harus menunggu
 * persetujuan lawan sebelum microphone dinyalakan.
 */
export default function AudioCall({ matchId, meId, otherName }: { matchId: string; meId: string; otherName: string }) {
  const supabase = useRef(createClient()).current;
  const [phase, setPhase] = useState<Phase>("idle");
  const [incoming, setIncoming] = useState<Incoming | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const savedCandidates = useRef<RTCIceCandidateInit[]>([]);
  const callIdRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("idle");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const send = useCallback((event: string, payload: object) => {
    void channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  const cleanup = useCallback((notify = false) => {
    if (notify) send("call-end", { callId: callIdRef.current });
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    savedCandidates.current = [];
    callIdRef.current = null;
    setIncoming(null);
    setMuted(false);
    setSeconds(0);
    setPhase("idle");
  }, [send]);

  const setupPeer = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const pc = new RTCPeerConnection(ICE);
    streamRef.current = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.onicecandidate = (event) => {
      if (event.candidate && callIdRef.current) {
        send("call-ice", { callId: callIdRef.current, candidate: event.candidate.toJSON() });
      }
    };
    pc.ontrack = (event) => {
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
        void audioRef.current.play().catch(() => undefined);
      }
      setPhase("active");
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setError("Panggilan terputus. Coba lagi.");
        cleanup(true);
      }
    };
    pcRef.current = pc;
    return pc;
  }, [cleanup, send]);

  const end = useCallback(() => cleanup(true), [cleanup]);

  useEffect(() => {
    const channel = supabase
      .channel(`call-${matchId}`)
      .on("broadcast", { event: "call-request" }, ({ payload }) => {
        const data = payload as Incoming;
        if (!data?.callId || data.from === meId || phaseRef.current !== "idle") return;
        setIncoming(data);
        setPhase("incoming");
      })
      .on("broadcast", { event: "call-accept" }, ({ payload }) => {
        const data = payload as Signal;
        if (data.callId !== callIdRef.current || phaseRef.current !== "calling") return;
        setPhase("connecting");
        void (async () => {
          try {
            const pc = await setupPeer();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send("call-offer", { callId: data.callId, sdp: pc.localDescription });
          } catch {
            setError("Microphone tidak bisa dipakai. Periksa izin browser.");
            cleanup(true);
          }
        })();
      })
      .on("broadcast", { event: "call-reject" }, ({ payload }) => {
        const data = payload as Signal;
        if (data.callId !== callIdRef.current) return;
        setError("Panggilan ditolak.");
        cleanup();
      })
      .on("broadcast", { event: "call-offer" }, ({ payload }) => {
        const data = payload as Signal & { sdp?: RTCSessionDescriptionInit };
        if (data.callId !== callIdRef.current || phaseRef.current !== "connecting" || !pcRef.current || !data.sdp) return;
        void (async () => {
          try {
            await pcRef.current?.setRemoteDescription(data.sdp!);
            for (const candidate of savedCandidates.current) await pcRef.current?.addIceCandidate(candidate);
            savedCandidates.current = [];
            const answer = await pcRef.current!.createAnswer();
            await pcRef.current!.setLocalDescription(answer);
            send("call-answer", { callId: data.callId, sdp: pcRef.current!.localDescription });
          } catch {
            setError("Panggilan gagal tersambung.");
            cleanup(true);
          }
        })();
      })
      .on("broadcast", { event: "call-answer" }, ({ payload }) => {
        const data = payload as Signal & { sdp?: RTCSessionDescriptionInit };
        if (data.callId !== callIdRef.current || !data.sdp) return;
        void pcRef.current?.setRemoteDescription(data.sdp).then(async () => {
          for (const candidate of savedCandidates.current) await pcRef.current?.addIceCandidate(candidate);
          savedCandidates.current = [];
        }).catch(() => {
          setError("Panggilan gagal tersambung.");
          cleanup(true);
        });
      })
      .on("broadcast", { event: "call-ice" }, ({ payload }) => {
        const data = payload as Signal & { candidate?: RTCIceCandidateInit };
        if (data.callId !== callIdRef.current || !data.candidate) return;
        if (pcRef.current?.remoteDescription) {
          void pcRef.current.addIceCandidate(data.candidate);
        } else {
          savedCandidates.current.push(data.candidate);
        }
      })
      .on("broadcast", { event: "call-end" }, ({ payload }) => {
        const data = payload as Signal;
        if (data.callId === callIdRef.current) cleanup();
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [cleanup, matchId, meId, send, setupPeer, supabase]);

  useEffect(() => {
    if (phase !== "calling") return;
    const timer = window.setTimeout(() => {
      setError("Tidak ada jawaban. Coba lagi nanti.");
      cleanup(true);
    }, 45_000);
    return () => window.clearTimeout(timer);
  }, [cleanup, phase]);

  useEffect(() => {
    if (phase !== "active") return;
    const timer = window.setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => () => {
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function start() {
    const callId = crypto.randomUUID();
    callIdRef.current = callId;
    setError(null);
    setPhase("calling");
    send("call-request", { callId, from: meId });
  }

  async function accept() {
    if (!incoming) return;
    callIdRef.current = incoming.callId;
    setPhase("connecting");
    try {
      await setupPeer();
      send("call-accept", { callId: incoming.callId, from: meId });
      setIncoming(null);
    } catch {
      setError("Microphone tidak bisa dipakai. Periksa izin browser.");
      cleanup(true);
    }
  }

  function reject() {
    if (incoming) send("call-reject", { callId: incoming.callId, from: meId });
    cleanup();
  }

  function toggleMute() {
    const stream = streamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((track) => { track.enabled = !next; });
    setMuted(next);
  }

  const modal = phase !== "idle";
  return (
    <>
      <button
        type="button"
        onClick={start}
        aria-label={`Telepon ${otherName || "match"}`}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper shadow-[0_6px_16px_-8px_rgba(32,26,20,0.6)] transition-transform active:scale-95"
      >
        <Icon name="phone" filled className="h-[18px] w-[18px]" />
      </button>
      <audio ref={audioRef} autoPlay playsInline className="hidden" />
      {error && !modal ? (
        <p role="status" className="fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-lg">
          {error}
        </p>
      ) : null}
      {modal ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Panggilan suara">
          <div className="w-full max-w-[360px] rounded-[24px] border border-line bg-paper p-6 text-center shadow-[0_28px_80px_-24px_rgba(0,0,0,0.45)]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush-tint text-blush-deep">
              <Icon name="phone" className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-[-0.02em]">
              {phase === "incoming" ? `${otherName || "Dia"} menelepon` : phase === "calling" ? `Memanggil ${otherName || "dia"}…` : phase === "active" ? "Panggilan aktif" : "Menyambungkan…"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              {phase === "incoming" ? "Terima hanya kalau kamu memang mau bicara." : phase === "active" ? secondsLabel(seconds) : "Panggilan suara aman. Tidak ada nomor telepon yang dibagikan."}
            </p>
            {error ? <p className="mt-3 rounded-[9px] bg-paper-2 px-3 py-2 text-sm font-medium text-blush-deep">{error}</p> : null}
            <div className="mt-5 flex flex-col gap-2">
              {phase === "incoming" ? (
                <>
                  <button type="button" onClick={accept} className="min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-paper">Terima panggilan</button>
                  <button type="button" onClick={reject} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-ink-soft">Tolak</button>
                </>
              ) : phase === "calling" ? (
                <button type="button" onClick={end} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-ink-soft">Batalkan</button>
              ) : phase === "connecting" ? (
                <button type="button" onClick={end} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-ink-soft">Akhiri</button>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={toggleMute} className="min-h-11 flex-1 rounded-full border border-line px-4 text-sm font-semibold text-ink-soft">{muted ? "Nyalakan mic" : "Bisukan"}</button>
                  <button type="button" onClick={end} className="min-h-11 flex-1 rounded-full bg-blush-deep px-4 text-sm font-semibold text-paper">Akhiri</button>
                </div>
              )}
            </div>
            {phase === "connecting" || phase === "active" ? (
              <p className="mt-3 text-[11px] text-ink-faint">Panggilan berjalan di browser. Jangan tutup tab.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

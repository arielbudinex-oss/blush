"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Meter } from "@/components/motion";
import { Icon } from "@/components/Icon";
import { btnGhost, btnPrimary } from "@/components/ui";
import { stepSatisfied } from "@/lib/face-steps";
import type { Challenge } from "@/lib/face-steps";

type Phase = "intro" | "loading" | "live" | "checking" | "done" | "error";

const CHALLENGE_TEXT: Record<Challenge, string> = {
  kiri: "Tengok sedikit ke kiri",
  kanan: "Tengok sedikit ke kanan",
  dekat: "Dekatkan wajah ke kamera",
};

const ORDER: Challenge[] = ["kiri", "kanan", "dekat"];
const NEED_HITS = 1;
const FRAME_MS = 120;

type FaceApi = {
  nets: {
    ssdMobilenetv1: { loadFromUri: (u: string) => Promise<void> };
    tinyFaceDetector: { loadFromUri: (u: string) => Promise<void> };
    faceLandmark68Net: { loadFromUri: (u: string) => Promise<void> };
    faceRecognitionNet: { loadFromUri: (u: string) => Promise<void> };
  };
  SsdMobilenetv1Options: new (opts: { minConfidence?: number }) => unknown;
  TinyFaceDetectorOptions: new (opts: { inputSize?: number; scoreThreshold?: number }) => unknown;
  detectSingleFace: (input: HTMLVideoElement, opts: unknown) => any;
  detectAllFaces: (input: HTMLVideoElement, opts: unknown) => Promise<unknown[]>;
};

/** Verifikasi wajah: semua deteksi jalan di perangkat, server hanya menerima deskriptor. */
export default function FaceVerify({ verified }: { verified: boolean }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const apiRef = useRef<FaceApi | null>(null);
  const recognitionRef = useRef<Promise<void> | null>(null);
  const busyRef = useRef(false);
  const hitsRef = useRef(0);
  const lastFrame = useRef(0);
  const missRef = useRef(0);
  const [slow, setSlow] = useState(false);

  const [phase, setPhase] = useState<Phase>(verified ? "done" : "intro");
  const [step, setStep] = useState(0);
  const [hint, setHint] = useState("Posisikan wajah di dalam bingkai.");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function loadModels() {
    if (apiRef.current) return apiRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faceapi = (await import("@vladmandic/face-api")) as unknown as FaceApi;
    const load = Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models/face"),
      faceapi.nets.tinyFaceDetector.loadFromUri("/models/face"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models/face"),
    ]);
    // Jangan biarkan layar "Menyiapkan model" menggantung tanpa akhir.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Model wajah terlalu lama dimuat. Cek koneksi lalu coba lagi.")), 60000),
    );
    await Promise.race([load, timeout]);
    apiRef.current = faceapi;
    return faceapi;
  }

  /** Model pengenal dimuat belakangan supaya kamera cepat terbuka. */
  async function ensureRecognition(api: FaceApi) {
    if (!recognitionRef.current) {
      recognitionRef.current = api.nets.faceRecognitionNet.loadFromUri("/models/face").catch((e) => {
        recognitionRef.current = null;
        throw e;
      });
    }
    await Promise.race([
      recognitionRef.current,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Model pengenal wajah belum siap. Muat ulang halaman lalu coba lagi.")), 45000),
      ),
    ]);
  }

  async function start() {
    setPhase("loading");
    setError(null);
    setProgress(0);
    setStep(0);
    setSlow(false);
    busyRef.current = false;
    hitsRef.current = 0;
    missRef.current = 0;
    lastFrame.current = 0;
    try {
      await loadModels();
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        // Beberapa HP menolak constraint resolusi; minta kamera apa adanya.
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Elemen kamera tidak siap.");
      video.srcObject = stream;
      if (video.readyState < 2) {
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          video.addEventListener("loadedmetadata", done, { once: true });
          window.setTimeout(done, 4000);
        });
      }
      await video.play();
      setPhase("live");
      setHint("Posisikan wajah di dalam bingkai.");
      void ensureRecognition(apiRef.current!).catch(() => {
        // Kalau gagal, error muncul saat menyelesaikan tantangan.
      });
      loop();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Kamera tidak bisa dibuka.";
      setError(
        /permission|denied|NotAllowed/i.test(msg)
          ? "Izin kamera ditolak. Aktifkan izin kamera di browser lalu coba lagi."
          : /NotFoundError|Requested device not found/i.test(msg)
            ? "Kamera tidak ditemukan. Coba dari HP atau colok kamera."
            : /NotReadableError|Could not start video/i.test(msg)
              ? "Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu coba lagi."
              : msg,
      );
      setPhase("error");
    }
  }

  function loop() {
    const api = apiRef.current;
    const video = videoRef.current;
    if (!api || !video || busyRef.current) return;

    const tick = async () => {
      if (!apiRef.current || !videoRef.current || busyRef.current) return;
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(() => void tick());
        return;
      }
      // Batasi inferensi ~8 fps supaya HP kelas menengah tidak tersendat.
      if (performance.now() - lastFrame.current < FRAME_MS) {
        rafRef.current = requestAnimationFrame(() => void tick());
        return;
      }
      lastFrame.current = performance.now();
      try {
        const opts = new api.SsdMobilenetv1Options({ minConfidence: 0.35 });
        let det = await api.detectSingleFace(video, opts).withFaceLandmarks();
        if (!det) {
          missRef.current += 1;
          // Detektor kecil lebih cepat pada wajah yang jauh atau kamera gelap.
          if (missRef.current >= 2) {
            const tiny = new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 });
            det = await api.detectSingleFace(video, tiny).withFaceLandmarks();
          }
        } else {
          missRef.current = 0;
        }
        if (!det) {
          hitsRef.current = 0;
          setHint("Wajah belum terdeteksi. Cahaya cukup dan hadap kamera.");
        } else {
          checkStep(det);
        }
      } catch {
        // frame gagal sesekali: abaikan, lanjut frame berikutnya
      }
      if (!busyRef.current) rafRef.current = requestAnimationFrame(() => void tick());
    };

    rafRef.current = requestAnimationFrame(() => void tick());
  }

  function checkStep(det: any) {
    const current = ORDER[step];
    if (!current) return;
    const { box } = det.detection;
    const nose = det.landmarks.getNose()?.[3] ?? det.landmarks.positions?.[30];
    const video = videoRef.current;
    if (!nose || !video) return;
    const ok = stepSatisfied(current, box, nose, video.videoWidth);

    if (ok) {
      hitsRef.current += 1;
      setProgress(Math.min(1, (step + hitsRef.current / NEED_HITS) / ORDER.length));
      setHint("Bagus, tahan sebentar…");
      if (hitsRef.current >= NEED_HITS) advance();
    } else {
      hitsRef.current = 0;
      setHint(CHALLENGE_TEXT[current]);
    }
  }

  function advance() {
    hitsRef.current = 0;
    const next = step + 1;
    setStep(next);
    setProgress(next / ORDER.length);
    if (next >= ORDER.length) {
      void finish();
    } else {
      setHint(CHALLENGE_TEXT[ORDER[next]]);
    }
  }

  async function finish() {
    const api = apiRef.current;
    const video = videoRef.current;
    if (!api || !video || busyRef.current) return;
    busyRef.current = true;
    setPhase("checking");
    setHint("Mengunci wajah…");

    try {
      await ensureRecognition(api);
      const opts = new api.SsdMobilenetv1Options({ minConfidence: 0.4 });
      const shots: Float32Array[] = [];
      for (let i = 0; i < 4; i += 1) {
        const det = await api.detectSingleFace(video, opts).withFaceLandmarks().withFaceDescriptor();
        if (det?.descriptor) shots.push(det.descriptor as Float32Array);
        await new Promise((r) => setTimeout(r, 180));
      }
      if (shots.length < 2) {
        // Satu percobaan terakhir dengan detektor kecil sebelum menyerah.
        const tiny = new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 });
        for (let i = 0; i < 3 && shots.length < 2; i += 1) {
          const det = await api.detectSingleFace(video, tiny).withFaceLandmarks().withFaceDescriptor();
          if (det?.descriptor) shots.push(det.descriptor as Float32Array);
          await new Promise((r) => setTimeout(r, 120));
        }
      }
      if (shots.length < 2) throw new Error("Wajah sulit dibaca. Coba lagi dengan cahaya lebih terang.");

      // dua deskriptor yang jauh berbeda berarti wajah berubah --> tolak
      let worst = 0;
      for (let i = 1; i < shots.length; i += 1) {
        let sum = 0;
        for (let j = 0; j < 128; j += 1) {
          const d = shots[i][j] - shots[0][j];
          sum += d * d;
        }
        worst = Math.max(worst, Math.sqrt(sum));
      }
      if (worst > 0.6) throw new Error("Wajah berubah saat dipindai. Tahan diam lalu ulangi.");

      const merged = Array.from({ length: 128 }, (_, j) => {
        let sum = 0;
        for (const s of shots) sum += s[j];
        return sum / shots.length;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = Math.round((video.videoHeight / video.videoWidth) * 480) || 480;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const selfie = canvas.toDataURL("image/jpeg", 0.78);

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      const res = await fetch("/api/verify/face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          descriptor: merged,
          challenges: ORDER,
          selfie,
          device: navigator.userAgent.slice(0, 120),
        }),
      }).finally(() => window.clearTimeout(timeout));
      const json = (await res.json()) as { ok?: boolean; status?: string; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Verifikasi gagal.");

      stopCamera();
      setPhase("done");
      setProgress(1);
      router.refresh();
    } catch (e) {
      busyRef.current = false;
      setError(e instanceof Error ? e.message : "Verifikasi gagal.");
      setPhase("error");
      stopCamera();
    }
  }

  // Tantangan yang tidak kunjung lolos biasanya karena kamera gelap atau wajah terlalu kecil.
  useEffect(() => {
    if (phase !== "live") {
      setSlow(false);
      return;
    }
    const id = window.setTimeout(() => setSlow(true), 12000);
    return () => window.clearTimeout(id);
  }, [phase, step]);

  if (phase === "done") {
    return (
      <div className="rounded-card border border-ok bg-paper p-[var(--space-lg)]">
        <span className="inline-flex items-center gap-1 rounded-[999px] bg-verify px-2.5 py-1 text-2xs font-semibold text-white">
          <Icon name="check" className="h-3 w-3" strokeWidth={2.4} />
          Terverifikasi
        </span>
        <h2 className="mt-3 text-2xl">Centang biru sudah aktif</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Badge muncul di profil, kartu deck, dan daftar chat. Satu wajah hanya untuk satu akun.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/app/profile" className={btnPrimary}>
            Lihat profil
          </Link>
          <Link href="/app/settings" className={btnGhost}>
            Pengaturan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-[var(--space-lg)] md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div className="relative overflow-hidden rounded-card border border-line bg-ink">
        <div className="aspect-[3/4] w-full">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
            aria-label="Pratinjau kamera verifikasi"
          />
        </div>
        {phase === "live" ? (
          <div className="pointer-events-none absolute inset-6 rounded-[999px] border-2 border-dashed border-paper/70" aria-hidden="true" />
        ) : null}
        {phase === "intro" || phase === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/80 p-4 text-center text-paper">
            <span className="rounded-[999px] border border-paper/30 px-2 py-0.5 text-2xs font-semibold text-paper/85">
              Opsional
            </span>
            <p className="font-display text-lg font-bold">Pindai wajah</p>
            <p className="max-w-[26ch] text-xs text-paper/85">
              Kamera hanya berjalan di perangkatmu. Yang dikirim angka wajah, bukan foto atau video.
            </p>
          </div>
        ) : null}
        {phase === "loading" || phase === "checking" ? (
          <div className="absolute inset-0 grid place-items-center bg-ink/70 text-sm font-semibold text-paper">
            {phase === "loading" ? "Menyiapkan model wajah… pertama kali bisa 10 sampai 20 detik." : "Memeriksa…"}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-[var(--space-md)]">
        <div className="rounded-card border border-line bg-paper p-[var(--space-md)]">
          <span className="text-xs font-semibold text-ink-soft">Langkah verifikasi</span>
          <ol className="mt-2 space-y-2">
            {ORDER.map((c, i) => (
              <li key={c} className="flex items-center gap-2 text-sm">
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-[999px] text-2xs font-bold ${
                    i < step ? "bg-verify text-white" : i === step ? "bg-blush-deep text-paper" : "bg-paper-3 text-ink-faint"
                  }`}
                >
                  {i < step ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} /> : i + 1}
                </span>
                <span className={i === step ? "font-semibold text-ink" : "text-ink-soft"}>{CHALLENGE_TEXT[c]}</span>
              </li>
            ))}
          </ol>
          <div className="mt-3">
            <Meter value={progress * 100} max={100} />
          </div>
          <p className="mt-2 text-sm font-semibold text-ink" role="status" aria-live="polite">
            {hint}
          </p>
          {slow && phase === "live" ? (
            <button
              type="button"
              onClick={advance}
              className="mt-1 text-xs font-semibold text-blush-deep underline underline-offset-2"
            >
              Wajah sudah saya gerakkan, lanjut langkah ini
            </button>
          ) : null}
          {slow && phase === "live" ? (
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Kalau wajah tetap tidak terbaca: dekatkan wajah sampai memenuhi lingkaran, hadapkan ke cahaya,
              lalu gerakkan kepala sedikit lebih jauh. Verifikasi ini opsional, kamu bisa lanjut tanpa badge.
            </p>
          ) : null}
          {error ? <p className="mt-2 text-xs font-medium text-blush-deep">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {phase === "live" ? (
              <>
                <button type="button" className={btnGhost} onClick={() => { stopCamera(); setPhase("intro"); setStep(0); setProgress(0); }}>
                  Hentikan kamera
                </button>
                <Link href="/app/discover" className={btnGhost}>
                  Lewati dulu
                </Link>
              </>
            ) : (
              <>
                <button type="button" className={btnPrimary} onClick={start}>
                  {phase === "error" ? "Coba lagi" : "Mulai pindai"}
                </button>
                <Link href="/app/discover" className={btnGhost}>
                  Lewati dulu
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="rounded-card border border-line bg-paper-2 p-[var(--space-md)]">
          <span className="text-xs font-semibold text-ink-soft">Kenapa banyak yang verifikasi</span>
          <p className="mt-2 text-sm text-ink-soft">
            Supaya orang lebih mudah percaya. Kamu diminta bergerak sedikit, jadi foto diam atau video tidak bisa lolos.
            Verifikasi ini opsional.
          </p>
        </div>
      </div>
    </div>
  );
}

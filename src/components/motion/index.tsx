"use client";

/**
 * Primitif animasi Blush. Semua berbasis `motion`, tidak ada aset pihak lain.
 * Aturan: kalau pengguna minta reduced motion, konten tetap tampil penuh —
 * yang dimatikan hanya gerak, bukan elemen (jangan sampai konten hilang).
 */
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  animate,
  type Variants,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

export const springSoft = { type: "spring" as const, stiffness: 260, damping: 28, mass: 0.9 };
export const springSnap = { type: "spring" as const, stiffness: 420, damping: 32 };

/** Wrapper daftar dengan animasi masuk bertahap. */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.055, delayChildren: reduce ? 0 : 0.04 } },
  };
  return (
    <motion.div className={className} initial="hidden" animate="show" variants={variants}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Angka yang naik halus saat nilainya berubah. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString("id-ID"));
  const [text, setText] = useState(() => Math.round(value).toLocaleString("id-ID"));

  useEffect(() => {
    if (reduce) {
      setText(Math.round(value).toLocaleString("id-ID"));
      return;
    }
    const controls = animate(mv, value, { duration: 0.45, ease: [0.22, 1, 0.36, 1] });
    const unsub = rounded.on("change", (v) => setText(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, reduce, mv, rounded]);

  return <span className={className}>{text}</span>;
}

/** Percikan kecil saat tombol utama ditekan (gaya reactbits, tanpa canvas). */
export function ClickSpark({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);
  const seq = useRef(0);

  function burst(e: React.MouseEvent<HTMLSpanElement>) {
    if (reduce) return;
    const box = e.currentTarget.getBoundingClientRect();
    const id = ++seq.current;
    setSparks((s) => [...s, { id, x: e.clientX - box.left, y: e.clientY - box.top }]);
    window.setTimeout(() => setSparks((s) => s.filter((v) => v.id !== id)), 520);
  }

  return (
    <span className={`relative inline-flex ${className ?? ""}`} onClick={burst}>
      {children}
      {sparks.map((s) => (
        <span key={s.id} className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="blush-spark"
              style={{
                left: s.x,
                top: s.y,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ["--spark-angle" as any]: `${i * 45}deg`,
                animationDelay: `${i * 8}ms`,
              }}
            />
          ))}
        </span>
      ))}
    </span>
  );
}

/** Perayaan match: kartu membal, cincin partikel mengembang. */
export function MatchBurst({ label }: { label: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex h-28 w-full items-center justify-center">
      {!reduce
        ? Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-2 w-2 rounded-[999px] bg-blush"
              initial={{ scale: 0, x: 0, y: 0, opacity: 0.9 }}
              animate={{
                scale: [0, 1, 0.4],
                x: Math.cos((i / 12) * Math.PI * 2) * 84,
                y: Math.sin((i / 12) * Math.PI * 2) * 62,
                opacity: [0.95, 0.85, 0],
              }}
              transition={{ duration: 0.9, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
            />
          ))
        : null}
      <motion.div
        initial={reduce ? false : { scale: 0.82, rotate: -6, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={reduce ? { duration: 0 } : springSoft}
        className="relative flex h-24 w-24 items-center justify-center rounded-[999px] border border-line-strong bg-paper-2 font-display text-3xl font-bold text-ink-soft"
      >
        {label.trim().charAt(0).toUpperCase() || "B"}
      </motion.div>
    </div>
  );
}

/** Transisi masuk untuk halaman anak. */
export function PageFade({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Bar progres tipis (dipakai onboarding & kuota like). */
export function Meter({ value, max, className }: { value: number; max: number; className?: string }) {
  const reduce = useReducedMotion();
  const raw = max <= 0 ? 0 : Math.min(1, value / max);
  const w = useSpring(raw, { stiffness: 180, damping: 26 });
  return (
    <div className={`h-2 w-full overflow-hidden rounded-[999px] bg-paper-3 ${className ?? ""}`} aria-hidden="true">
      <motion.div
        className="h-full rounded-[999px] bg-blush-deep"
        style={{ width: reduce ? `${raw * 100}%` : w }}
        animate={reduce ? undefined : { width: `${raw * 100}%` }}
        transition={reduce ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export { AnimatePresence, motion, useReducedMotion };

"use client";

import { useEffect, useState } from "react";

/** Angka yang naik halus saat nilainya berubah, tanpa pustaka animasi. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const [text, setText] = useState(() => Math.round(value).toLocaleString("id-ID"));

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setText(Math.round(value).toLocaleString("id-ID"));
      return;
    }
    const from = Number(text.replace(/\./g, "")) || 0;
    const start = performance.now();
    const duration = 450;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setText(Math.round(from + (value - from) * eased).toLocaleString("id-ID"));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // text sengaja tidak masuk dependensi: hanya nilai baru yang memicu animasi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{text}</span>;
}

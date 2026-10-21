"use client";

import { useEffect, useState } from "react";

/** Sisa waktu match dalam jam/menit; dihitung di klien supaya tidak beda zona waktu server. */
export default function ExpiryChip({ expiresAt }: { expiresAt: string | null }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const end = new Date(expiresAt).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt || left === null) return null;
  const hours = Math.floor(left / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);
  const urgent = left < 6 * 3_600_000;
  const label = left === 0 ? "Kedaluwarsa" : hours > 0 ? `${hours} jam lagi` : `${minutes} menit lagi`;

  return (
    <span
      className={`shrink-0 rounded-[999px] border px-2 py-0.5 text-2xs font-semibold ${
        urgent ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line text-ink-faint"
      }`}
    >
      {label}
    </span>
  );
}

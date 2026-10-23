"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

type LinkRow = { target: string; label: string; clicks: number; ips: number; sessions: number };
type ClickRow = { target: string; label: string; device: string; browser: string; ipMasked: string; at: string };
type Analytics = { topLinks: LinkRow[]; recentClicks: ClickRow[]; error?: string };

function when(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso));
}

export default function AdminLinks() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/analytics", { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as Analytics;
        if (!res.ok) throw new Error(json.error ?? "Gagal memuat tautan.");
        if (alive) setData(json);
      })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : "Gagal memuat tautan."); });
    return () => { alive = false; };
  }, []);

  if (error) return <p className="mt-5 rounded-card border border-blush-deep/30 bg-blush/10 px-4 py-3 text-sm text-blush-deep">{error}</p>;
  if (!data) return <p className="mt-5 text-sm text-ink-soft">Memuat tautan…</p>;

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="min-w-0 rounded-card border border-line bg-paper p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="min-w-0 font-display text-lg font-semibold tracking-[-0.01em]">Semua tautan</h2>
          <span className="shrink-0 text-xs text-ink-soft">{data.topLinks.length} tautan</span>
        </div>
        {data.topLinks.length === 0 ? (
          <p className="mt-4 rounded-[9px] bg-paper-2 px-3 py-5 text-sm text-ink-soft">Belum ada klik tautan.</p>
        ) : (
          <ol className="mt-4 flex flex-col gap-3">
            {data.topLinks.map((link, i) => (
              <li key={link.target} className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper-2 text-xs font-bold tabular-nums text-ink-soft">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{link.label || link.target}</p>
                  <p className="mt-1 break-all text-xs leading-5 text-ink-soft">{link.target}</p>
                  <p className="mt-1 text-xs font-medium text-ink-soft">{link.clicks} klik · {link.ips} IP · {link.sessions} sesi</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="min-w-0 rounded-card border border-line bg-paper p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-[-0.01em]">Klik terbaru</h2>
          <Link href="/admin/aktivitas" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-ink">
            <Icon name="back" className="h-3.5 w-3.5" /> Kembali
          </Link>
        </div>
        {data.recentClicks.length === 0 ? (
          <p className="mt-4 rounded-[9px] bg-paper-2 px-3 py-5 text-sm text-ink-soft">Belum ada klik.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-line">
            {data.recentClicks.map((click, i) => (
              <li key={`${click.at}-${i}`} className="py-2.5">
                <p className="truncate text-sm font-semibold text-ink">{click.label || click.target}</p>
                <p className="mt-1 text-xs leading-5 text-ink-soft">{click.device} · {click.browser} · {click.ipMasked}</p>
                <p className="text-[11px] text-ink-faint">{when(click.at)} WIB</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

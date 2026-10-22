"use client";

type HourRow = { label: string; views: number; clicks: number };

/** Grafik batang sederhana dengan sumbu, grid, dan nilai yang bisa dibaca. */
export default function TrafficChart({ hourly }: { hourly: HourRow[] }) {
  const max = Math.max(1, ...hourly.map((h) => h.views + h.clicks));
  const total = hourly.reduce((sum, h) => sum + h.views + h.clicks, 0);
  if (total === 0) {
    return (
      <p className="mt-5 rounded-[10px] bg-paper-2 px-3 py-6 text-center text-sm text-ink-soft">
        Belum ada kunjungan tercatat dalam 24 jam terakhir.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex h-44 items-stretch gap-3">
        <div className="flex w-7 shrink-0 flex-col justify-between pb-5 pt-1 text-right text-[10px] tabular-nums text-ink-faint" aria-hidden="true">
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 bottom-5 top-1 flex flex-col justify-between" aria-hidden="true">
            {[0, 1, 2].map((n) => <span key={n} className="border-t border-line/70" />)}
          </div>
          <div className="relative flex h-full items-end gap-1">
            {hourly.map((hour, i) => {
              const totalHour = hour.views + hour.clicks;
              return (
                <div key={`${hour.label}-${i}`} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-0.5" title={`${hour.label}: ${hour.views} kunjungan, ${hour.clicks} klik`}>
                  <div className="flex w-full flex-col justify-end gap-0.5" style={{ height: `${(totalHour / max) * 100}%` }}>
                    {hour.clicks > 0 ? <span className="w-full rounded-t-[2px] bg-ink/75" style={{ height: `${(hour.clicks / totalHour) * 100}%` }} /> : null}
                    {hour.views > 0 ? <span className={`w-full bg-blush-deep/85 ${hour.clicks > 0 ? "" : "rounded-t-[2px]"}`} style={{ height: `${(hour.views / totalHour) * 100}%` }} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
            {[0, 6, 12, 18, 23].map((i) => <span key={i}>{hourly[i]?.label}</span>)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blush-deep" /> Kunjungan</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink/75" /> Klik</span>
        <span className="ml-auto tabular-nums">{total} event dalam 24 jam</span>
      </div>
    </div>
  );
}

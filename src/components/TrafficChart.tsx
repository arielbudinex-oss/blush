"use client";

type HourRow = { label: string; views: number; clicks: number };

const LABELS = [0, 6, 12, 18, 23];

/**
 * Grafik batang 24 jam. Tinggi tetap, sumbu Y punya tiga tick, label X
 * ditempatkan di kolom yang sama dengan batangnya supaya tidak bergeser.
 */
export default function TrafficChart({ hourly }: { hourly: HourRow[] }) {
  const rows = hourly.length ? hourly : [];
  const dataMax = Math.max(1, ...rows.map((h) => h.views + h.clicks));
  // Beri ruang di atas bar tertinggi supaya puncaknya tidak menyentuh tick atas.
  const max = Math.max(1, Math.ceil(dataMax * 1.1));
  const total = rows.reduce((sum, h) => sum + h.views + h.clicks, 0);
  if (total === 0) {
    return (
      <div className="mt-4 rounded-[10px] bg-paper-2 px-4 py-8 text-center">
        <p className="text-sm font-medium text-ink">Belum ada kunjungan hari ini.</p>
        <p className="mt-1 text-xs leading-5 text-ink-soft">Grafik muncul setelah ada pengunjung yang membuka halaman.</p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="flex gap-3">
        <div className="flex w-8 shrink-0 flex-col justify-between pb-7 pt-1 text-right text-[11px] tabular-nums text-ink-soft" aria-hidden="true">
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-52">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1 flex flex-col justify-between" aria-hidden="true">
              {[0, 1, 2].map((n) => <span key={n} className="border-t border-line" />)}
            </div>
            <div className="absolute inset-x-0 bottom-0 top-1 flex items-end gap-1" aria-label="Grafik kunjungan dan klik per jam">
              {rows.map((hour, i) => {
                const totalHour = hour.views + hour.clicks;
                return (
                  <div
                    key={`${hour.label}-${i}`}
                    className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                    title={`${hour.label}: ${hour.views} kunjungan, ${hour.clicks} klik`}
                  >
                    {totalHour > 0 ? (
                      <div className="flex w-full flex-col justify-end overflow-hidden rounded-t-[3px]" style={{ height: `${(totalHour / max) * 100}%` }}>
                        {hour.views > 0 ? <span className="w-full bg-blush-deep/85" style={{ height: `${(hour.views / totalHour) * 100}%` }} /> : null}
                        {hour.clicks > 0 ? <span className="w-full bg-ink/75" style={{ height: `${(hour.clicks / totalHour) * 100}%` }} /> : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-2 h-4 text-[11px] tabular-nums text-ink-soft" aria-hidden="true">
            {rows.map((hour, i) => LABELS.includes(i) ? (
              <span key={`${hour.label}-${i}`} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${((i + 0.5) / rows.length) * 100}%` }}>
                {hour.label}
              </span>
            ) : null)}
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-faint">Jam (WIB)</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px] bg-blush-deep" /> Kunjungan</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px] bg-ink/75" /> Klik tautan</span>
        </div>
        <span className="tabular-nums">{total} event dalam 24 jam</span>
      </div>
    </div>
  );
}

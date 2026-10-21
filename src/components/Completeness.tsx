import { Icon } from "@/components/Icon";

export default function Completeness({
  percent,
  verified,
  gaps = [],
}: {
  percent: number;
  verified: boolean;
  gaps?: string[];
}) {
  return (
    <section aria-label="Kelengkapan profil" className="rounded-card border border-line bg-paper px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Kelengkapan profil</p>
        <span className="text-sm font-bold tabular-nums text-ink">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Kelengkapan profil"
        className="mt-2 h-2 overflow-hidden rounded-[999px] bg-line-strong"
      >
        <span
          className="block h-full rounded-[999px] bg-blush-deep transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      {gaps.length ? (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-xs font-medium text-ink">Berikutnya:</span>
          {gaps.map((g) => (
            <span key={g} className="rounded-[5px] bg-paper-2 px-1.5 py-0.5 text-xs font-medium text-ink">
              {g}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-1.5 text-xs text-ink-soft">
        {verified ? (
          gaps.length === 0
            ? "Semua beres. Centang biru bikin orang lebih gampang percaya."
            : "Verifikasi wajah sudah aktif."
        ) : (
          <>
            <span
              aria-hidden="true"
              className="mr-1 inline-grid h-3.5 w-3.5 translate-y-[1px] place-items-center rounded-full bg-verify text-white"
            >
              <Icon name="check" className="h-2.5 w-2.5" strokeWidth={2.8} />
            </span>
            Verifikasi wajah menambah 20%. Tanpa itu, profil berhenti di 80%.
          </>
        )}
      </p>
    </section>
  );
}

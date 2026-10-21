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
        <p className="text-sm font-semibold text-ink">Profil kamu {percent}% lengkap</p>
        <span className="text-sm font-bold tabular-nums text-ink">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Kelengkapan profil"
        className="mt-2 h-2 overflow-hidden rounded-[999px] bg-paper-3"
      >
        <span
          className="block h-full rounded-[999px] bg-blush-deep transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      {gaps.length ? (
        <p className="mt-2 text-xs font-medium text-ink">Berikutnya: {gaps.join(" · ")}</p>
      ) : null}
      <p className="mt-1.5 text-xs text-ink-soft">
        {verified ? (
          "Semua beres. Centang biru bikin orang lebih gampang percaya."
        ) : (
          <>
            <span
              aria-hidden="true"
              className="mr-1 inline-grid h-3.5 w-3.5 translate-y-[1px] place-items-center rounded-full bg-verify text-white"
            >
              <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 fill-none stroke-current stroke-[2.8]">
                <path d="M3.2 8.6l3 3 6.6-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Centang biru nyumbang 20% terakhir — tanpa itu, profil mentok 80%.
          </>
        )}
      </p>
    </section>
  );
}

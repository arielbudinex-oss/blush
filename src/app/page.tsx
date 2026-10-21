import Link from "next/link";

const primary =
  "app-press inline-flex min-h-12 items-center justify-center gap-2 rounded-[999px] bg-blush-deep px-6 text-sm font-bold text-paper transition-colors duration-200 hover:bg-ink";

function Check() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-[3]">
      <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Heart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 20s-7-4.35-7-9.2A4.3 4.3 0 0112 7.6a4.3 4.3 0 017 3.2C19 15.65 12 20 12 20z" />
    </svg>
  );
}

function Tab({ d, label, active = false }: { d: string; label: string; active?: boolean }) {
  return (
    <span className={`flex flex-col items-center gap-0.5 text-[0.62rem] font-bold ${active ? "text-blush-deep" : "text-ink-soft"}`}>
      <span className={`grid h-7 w-12 place-items-center rounded-[999px] ${active ? "bg-blush-tint" : ""}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]" strokeLinejoin="round">
          <path d={d} />
        </svg>
      </span>
      {label}
    </span>
  );
}

/** Kartu swipe contoh — komponen yang sama dengan deck asli, bukan hero marketing. */
function DeckPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[15.5rem] sm:max-w-[20rem]">
      <div className="absolute inset-x-4 -top-2 h-full rotate-2 rounded-[26px] border border-line bg-paper-3" aria-hidden="true" />
      <div className="absolute inset-x-2 -top-1 h-full -rotate-1 rounded-[26px] border border-line bg-paper-2" aria-hidden="true" />

      <div className="relative overflow-hidden rounded-[26px] border border-line bg-paper shadow-[0_28px_60px_-32px_oklch(0.35_0.1_20)]">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-blush-tint sm:aspect-[3/4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=760&q=80&auto=format&fit=crop"
            alt="Contoh kartu profil di deck Blush"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-x-0 top-0 flex gap-1 p-2.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-[3px] flex-1 rounded-[999px] ${i === 0 ? "bg-white" : "bg-white/70"}`} />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-4 pb-4 pt-20 text-white">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold leading-none">Nadia, 26</p>
              <span className="grid h-5 w-5 place-items-center rounded-[999px] bg-verify text-white">
                <Check />
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-white/90">Arsitek · Yogyakarta · 3 km</p>
          </div>
        </div>

        <div className="px-3 pb-2 pt-2.5">
          <div className="mt-2 hidden rounded-[12px] bg-paper-2 px-3 py-2 sm:block">
            <p className="text-[0.6rem] font-semibold text-ink-soft">Akhir pekan ideal</p>
            <p className="line-clamp-1 text-sm text-ink">Sepeda ke kota lama, mampir kopi.</p>
          </div>
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-hidden">
            {["Kopi", "Film", "Kucing"].map((t) => (
              <span key={t} className="shrink-0 rounded-[999px] border border-line-strong px-2.5 py-1 text-2xs font-semibold text-ink-soft">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 py-3">
          <span className="grid h-12 w-12 place-items-center rounded-[999px] border border-line-strong bg-paper text-ink">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[2.2]">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </span>
          <span className="grid h-12 w-12 place-items-center rounded-[999px] border border-ok bg-paper text-ok">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" strokeLinejoin="round">
              <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.8l-5.3 2.8 1.1-5.8L3.5 9.7l5.9-.8z" />
            </svg>
          </span>
          <span className="grid h-14 w-14 place-items-center rounded-[999px] bg-blush-deep text-paper">
            <Heart className="h-6 w-6" />
          </span>
        </div>

        <div className="flex items-center justify-around border-t border-line px-2 pb-2.5 pt-1.5">
          <Tab d="M8 4.5h10.5a1.5 1.5 0 011.5 1.5v9M4.5 8.5A1.5 1.5 0 016 7h9a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0115 19H6a1.5 1.5 0 01-1.5-1.5z" label="Jelajah" active />
          <Tab d="M12 20s-7-4.35-7-9.2A4.3 4.3 0 0112 7.6a4.3 4.3 0 017 3.2C19 15.65 12 20 12 20z" label="Suka" />
          <Tab d="M4 6h16v10H9l-5 4z" label="Chat" />
          <Tab d="M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0" label="Profil" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="app-shell min-h-[100dvh] bg-paper">
      <header className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-blush-deep text-paper">
            <Heart className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-bold tracking-[-0.03em]">Blush</span>
        </Link>
        <Link href="/login" className="app-press inline-flex min-h-11 items-center rounded-[999px] border border-line-strong bg-paper px-4 text-sm font-bold text-ink hover:bg-paper-2">
          Masuk
        </Link>
      </header>

      <div className="mx-auto grid max-w-4xl gap-4 px-4 pb-8 pt-1 md:min-h-[calc(100dvh-3.5rem)] md:grid-cols-[1fr_auto] md:items-center md:gap-10 md:pb-10">
        <div className="min-w-0 md:max-w-[24rem]">
          <h1 className="text-[1.75rem] font-bold leading-[1.06] tracking-[-0.03em] sm:text-[2.6rem]">
            Cari yang beneran,
            <br />
            bukan yang basa-basi.
          </h1>
          <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-ink-soft">
            Isi profil sekali, geser kalau ada yang menarik. Saling suka, chat langsung terbuka.
          </p>

          <div className="mt-5 hidden gap-2 md:grid">
            <Link href="/signup" className={primary}>
              Buat akun
            </Link>
            <p className="text-center text-2xs font-medium text-ink">Gratis · 18+ · tanpa kartu kredit.</p>
          </div>
        </div>

        <div className="w-full max-w-[16.5rem] justify-self-center sm:max-w-[20rem] md:w-[20rem]">
          <DeckPreview />
        </div>

        <div className="grid gap-1.5 md:hidden">
          <Link href="/signup" className={primary}>
            Buat akun
          </Link>
          <p className="text-center text-2xs font-medium text-ink">Gratis · 18+ · tanpa kartu kredit.</p>
        </div>
      </div>
    </main>
  );
}

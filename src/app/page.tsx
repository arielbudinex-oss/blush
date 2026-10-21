import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";

const primary =
  "app-press inline-flex min-h-12 items-center justify-center gap-2 rounded-[999px] bg-blush-deep px-6 text-sm font-bold text-paper transition-colors duration-200 hover:bg-ink";

function Tab({ name, label, active = false }: { name: IconName; label: string; active?: boolean }) {
  return (
    <span className={`flex flex-col items-center gap-0.5 text-[0.62rem] font-bold ${active ? "text-blush-deep" : "text-ink-soft"}`}>
      <span className={`grid h-7 w-12 place-items-center rounded-[999px] ${active ? "bg-blush-tint" : ""}`}>
        <Icon name={name} className="h-4 w-4" />
      </span>
      {label}
    </span>
  );
}

/** Kartu swipe contoh — komponen yang sama dengan deck asli, bukan hero marketing. */
function DeckPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[14.5rem] sm:max-w-[20rem]">
      <div className="absolute inset-x-4 -top-2 h-full rotate-2 rounded-[26px] border border-line bg-blush-tint" aria-hidden="true" />
      <div className="absolute inset-x-2 -top-1 h-full -rotate-1 rounded-[26px] border border-line bg-paper-2" aria-hidden="true" />

      <span className="absolute -right-5 -top-6 z-20 -rotate-4 rounded-[9px] border border-blush-deep/30 bg-paper px-2.5 py-1 font-serif text-[0.82rem] italic leading-none text-blush-deep shadow-[0_8px_18px_-12px_oklch(0.35_0.1_20)]">
        kenalan dulu
      </span>

      <div className="relative overflow-hidden rounded-[26px] border border-line bg-paper shadow-[0_28px_60px_-32px_oklch(0.35_0.1_20)]">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-blush-tint sm:aspect-[3/4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/demo/nadia.jpg"
            alt="Contoh kartu profil di deck Blush"
            className="h-full w-full object-cover object-[center_38%]"
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
                <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-white/90">Arsitek · Yogyakarta · 3 km</p>
          </div>
        </div>

        <div className="px-3 pb-2 pt-2.5">
          <div className="mt-2 hidden rounded-[14px] bg-blush-tint/70 px-3 py-2.5 sm:block">
            <p className="font-serif text-[0.95rem] italic leading-snug text-ink">Akhir pekan ideal?</p>
            <p className="line-clamp-1 text-sm text-ink-soft">Sepeda ke kota lama, mampir kopi.</p>
          </div>
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-hidden">
            {["Kopi", "Film", "Kucing"].map((t) => (
              <span key={t} className="shrink-0 rounded-[999px] bg-blush-tint/55 px-2.5 py-1 text-2xs font-medium text-blush-deep">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 py-3">
          <span className="grid h-12 w-12 place-items-center rounded-[999px] border border-line-strong bg-paper text-ink">
            <Icon name="x" className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="grid h-12 w-12 place-items-center rounded-[999px] border border-pear bg-pear text-ink">
            <Icon name="star" className="h-5 w-5" filled />
          </span>
          <span className="grid h-14 w-14 place-items-center rounded-[999px] bg-blush-deep text-paper">
            <Icon name="heart" className="h-6 w-6" filled />
          </span>
        </div>

        <div className="flex items-center justify-around border-t border-line px-2 pb-2.5 pt-1.5">
          <Tab name="deck" label="Temukan" active />
          <Tab name="heart" label="Suka" />
          <Tab name="chat" label="Chat" />
          <Tab name="user" label="Profil" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-paper">
      <header className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-blush-deep text-paper">
            <Icon name="heart" className="h-4 w-4" filled />
          </span>
          <span className="font-display text-lg font-bold tracking-[-0.03em]">Blush</span>
        </Link>
        <Link href="/login" className="app-press inline-flex min-h-11 items-center px-1 text-sm font-semibold text-ink-soft underline decoration-line-strong decoration-1 underline-offset-4 hover:text-ink">
          Masuk
        </Link>
      </header>

      <div className="mx-auto grid max-w-4xl gap-3 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-1 md:min-h-[calc(100dvh-3.5rem)] md:grid-cols-[1fr_auto] md:items-center md:gap-10 md:pb-10">
        <div className="min-w-0 md:max-w-[24rem]">
          <h1 className="text-[2.15rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[3.1rem]">
            Cari yang{" "}
            <span className="relative inline-block">
              <em className="font-serif font-medium italic tracking-[-0.005em] text-blush-deep">beneran</em>
              <svg
                viewBox="0 0 140 8"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute -bottom-0.5 left-0 h-1.5 w-full text-blush/70"
              >
                <path d="M2 5.4C34 2.6 78 2.2 138 4.2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </span>
            ,
            <br />
            bukan yang basa-basi.
          </h1>
          <p className="mt-4 max-w-[32ch] text-[1rem] leading-[1.62] text-ink-soft">
            Isi profil sekali. Geser pelan-pelan, lihat yang cocok. Saling suka, chat langsung kebuka.
          </p>

          <div className="mt-5 hidden gap-2 md:grid">
            <Link href="/signup" className={primary}>
              Buat akun
            </Link>
            <p className="mt-2.5 text-center text-xs font-medium text-ink">Gratis buat mulai · Verifikasi wajah dapat centang biru · 18+</p>
          </div>
        </div>

        <div className="w-full max-w-[15.5rem] justify-self-center sm:max-w-[20rem] md:w-[20rem]">
          <DeckPreview />
        </div>

        <div className="grid gap-1.5 md:hidden">
          <Link href="/signup" className={primary}>
            Buat akun
          </Link>
          <p className="mt-2.5 text-center text-xs font-medium text-ink">Gratis buat mulai · Verifikasi wajah dapat centang biru · 18+</p>
        </div>
      </div>
    </main>
  );
}

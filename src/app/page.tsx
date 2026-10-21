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
                <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
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
            <Icon name="x" className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="grid h-12 w-12 place-items-center rounded-[999px] border border-ok bg-paper text-ok">
            <Icon name="star" className="h-5 w-5" />
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
    <main className="app-shell min-h-[100dvh] bg-paper">
      <header className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-blush-deep text-paper">
            <Icon name="heart" className="h-4 w-4" filled />
          </span>
          <span className="font-display text-lg font-bold tracking-[-0.03em]">Blush</span>
        </Link>
        <Link href="/login" className="app-press inline-flex min-h-11 items-center rounded-[999px] border border-line-strong bg-paper px-4 text-sm font-bold text-ink hover:bg-paper-2">
          Masuk
        </Link>
      </header>

      <div className="mx-auto grid max-w-4xl gap-4 px-4 pb-8 pt-1 md:min-h-[calc(100dvh-3.5rem)] md:grid-cols-[1fr_auto] md:items-center md:gap-10 md:pb-10">
        <div className="min-w-0 md:max-w-[24rem]">
          <h1 className="text-[2.05rem] font-bold leading-[1.03] tracking-[-0.032em] sm:text-[2.9rem]">
            Cari yang beneran,
            <br />
            bukan yang basa-basi.
          </h1>
          <p className="mt-3 max-w-[32ch] text-[0.95rem] leading-relaxed text-ink-soft">
            Isi profil sekali. Geser yang menarik, lewati yang nggak. Saling suka, chat langsung kebuka.
          </p>

          <div className="mt-5 hidden gap-2 md:grid">
            <Link href="/signup" className={primary}>
              Buat akun
            </Link>
            <p className="text-center text-2xs font-medium text-ink">Gratis buat mulai · Verifikasi foto dapat centang biru · 18+</p>
          </div>
        </div>

        <div className="w-full max-w-[16.5rem] justify-self-center sm:max-w-[20rem] md:w-[20rem]">
          <DeckPreview />
        </div>

        <div className="grid gap-1.5 md:hidden">
          <Link href="/signup" className={primary}>
            Buat akun
          </Link>
          <p className="text-center text-2xs font-medium text-ink">Gratis buat mulai · Verifikasi foto dapat centang biru · 18+</p>
        </div>
      </div>
    </main>
  );
}

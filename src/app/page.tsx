import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { Wordmark } from "@/components/Logo";
import { PLANS, formatIdr } from "@/lib/plans";

const primary =
  "app-press inline-flex min-h-12 items-center justify-center gap-2 rounded-[999px] bg-blush-deep px-6 text-sm font-bold text-paper transition-colors duration-200 hover:bg-ink";
const secondary =
  "app-press inline-flex min-h-12 items-center justify-center gap-2 rounded-[999px] border border-line-strong px-5 text-sm font-bold text-ink transition-colors duration-200 hover:border-ink hover:bg-paper-2";

function Phone({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[36px] border border-line bg-paper-2 p-1.5 shadow-[0_30px_70px_-40px_oklch(0.3_0.05_40)] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={390} height={844} loading="lazy" className="h-auto w-full rounded-[30px]" />
    </div>
  );
}

function Step({ n, title, body, src, alt }: { n: string; title: string; body: string; src: string; alt: string }) {
  return (
    <article className="grid gap-4 rounded-card border border-line bg-paper p-4 sm:grid-cols-[minmax(0,1fr)_9.5rem] sm:items-center">
      <div>
        <span className="text-xs font-bold tabular-nums text-blush-deep">{n}</span>
        <h3 className="mt-1 text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
      </div>
      <Phone src={src} alt={alt} className="mx-auto w-36" />
    </article>
  );
}

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "shield",
    title: "Verifikasi wajah, opsional",
    body: "Pindai sekali lewat kamera. Dapat centang biru dan tambahan 20% di kelengkapan profil. Tanpa verifikasi, profil tetap jalan.",
  },
  {
    icon: "deck",
    title: "Satu kartu, satu orang",
    body: "Foto, bio, minat, dan jawaban prompt tampil di kartu yang sama. Tidak ada tebak-tebakan dari foto saja.",
  },
  {
    icon: "filter",
    title: "Filter yang jelas",
    body: "Atur umur, jarak, gender, dan hanya profil terverifikasi. Gold bisa jelajah kota lain tanpa pindah domisili.",
  },
  {
    icon: "star",
    title: "Bayar pakai QRIS",
    body: "Semua bank dan e-wallet yang mendukung QRIS. Aktif setelah pembayaran dikonfirmasi, tanpa langganan tersembunyi.",
  },
];

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="inline-flex items-center" aria-label="Blush, ke beranda">
            <Wordmark size="md" />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Navigasi halaman">
            <a href="#cara-kerja" className="rounded-[999px] px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink">
              Cara kerja
            </a>
            <a href="#keamanan" className="rounded-[999px] px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink">
              Keamanan
            </a>
            <a href="#paket" className="rounded-[999px] px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink">
              Paket
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="inline-flex min-h-10 items-center px-2 text-sm font-bold text-ink transition-colors hover:text-blush-deep">
              Masuk
            </Link>
            <Link href="/signup" className="app-press inline-flex min-h-10 items-center rounded-[999px] bg-ink px-4 text-sm font-bold text-paper transition-colors hover:bg-blush-deep">
              Buat akun
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl items-center gap-8 px-4 pb-12 pt-8 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-10 md:pb-16 md:pt-12">
        <div className="min-w-0">
          <p className="text-xs font-bold text-blush-deep">Aplikasi kencan, dibuat di Indonesia</p>
          <h1 className="mt-2 text-pretty text-[2.4rem] font-bold leading-[1.03] tracking-[-0.035em] sm:text-[3.4rem]">
            Kenalan dulu,
            <br />
            urusan belakangan.
          </h1>
          <p className="mt-4 max-w-[38ch] text-pretty text-[1.02rem] leading-[1.6] text-ink-soft">
            Lihat foto, bio, dan jawaban singkat sebelum memutuskan. Saling suka, chat langsung terbuka. Verifikasi wajah
            opsional, buat yang mau centang biru.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/signup" className={primary}>
              Buat akun gratis
            </Link>
            <a href="#cara-kerja" className={secondary}>
              Lihat cara kerjanya
            </a>
          </div>
          <p className="mt-3 text-xs font-medium leading-relaxed text-ink-soft">
            Gratis dengan 20 like per hari. Tanpa kartu kredit, tanpa masa uji.
          </p>

          <dl className="mt-7 grid max-w-md grid-cols-3 gap-3 border-t border-line pt-5">
            <div>
              <dt className="text-2xs font-semibold text-ink-soft">Like gratis</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums">20 / hari</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold text-ink-soft">Superlike</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums">1 / hari</dd>
            </div>
            <div>
              <dt className="text-2xs font-semibold text-ink-soft">Blush Plus</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums">{formatIdr(PLANS.plus.priceIdr)}</dd>
            </div>
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-[19rem]">
          <div className="absolute inset-0 -z-10 -rotate-2 translate-y-2 rounded-[36px] border border-line bg-paper-3" aria-hidden="true" />
          <Phone src="/landing/deck.png" alt="Kartu profil Raka Aditya di deck Blush, lengkap dengan bio, prompt, dan minat" />
        </div>
      </section>

      <section id="cara-kerja" className="border-t border-line bg-paper-2/60">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Tiga langkah, tanpa drama</h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-ink-soft">
            Semua yang kamu isi di onboarding langsung dipakai untuk menyaring orang. Tidak ada form panjang yang tidak
            berpengaruh.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Step
              n="01"
              title="Isi yang penting saja"
              body="Nama panggilan, tanggal lahir, kota, dan tiga minat. Selesai dalam satu menit."
              src="/landing/profile.png"
              alt="Halaman profil Blush dengan foto, bio, dan kelengkapan profil"
            />
            <Step
              n="02"
              title="Geser dengan alasan"
              body="Setiap kartu menampilkan bio dan satu jawaban prompt. Suka, lewati, atau superlike."
              src="/landing/deck.png"
              alt="Kartu profil di deck Blush"
            />
            <Step
              n="03"
              title="Ngobrol kalau cocok"
              body="Saling suka membuka chat. Kirim pesan pertama, balasan muncul tanpa perlu muat ulang."
              src="/landing/chat.png"
              alt="Ruang chat Blush antara Rara dan Damar"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <h2 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Yang di dalamnya</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <article key={f.title} className="rounded-card border border-line bg-paper p-4">
              <span className="grid h-10 w-10 place-items-center rounded-[999px] bg-paper-2 text-ink">
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-base font-bold">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="keamanan" className="border-y border-line bg-paper-2/60">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[minmax(0,1fr)_16rem] md:items-center md:py-16">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Keamanan yang bisa kamu pakai</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {[
                ["Lokasi tidak dibagikan mentah", "Orang lain hanya melihat perkiraan jarak, bukan titik koordinat."],
                ["Blokir dan laporkan kapan saja", "Dari kartu atau dari dalam chat. Pelaku tidak dapat notifikasi."],
                ["Foto verifikasi tidak tampil", "Disimpan terpisah dan tidak pernah muncul di profil atau deck."],
                ["Batalkan match", "Chat ditutup untuk kalian berdua, lalu orang itu hilang dari deck."],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok/10 text-ok">
                    <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-ink-soft">
                    <strong className="font-semibold text-ink">{title}.</strong> {body}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-ink-soft">
              Baca <Link href="/privasi" className="font-semibold text-ink underline underline-offset-2 hover:text-blush-deep">kebijakan privasi</Link>{" "}
              dan <Link href="/syarat" className="font-semibold text-ink underline underline-offset-2 hover:text-blush-deep">syarat pemakaian</Link>.
            </p>
          </div>
          <Phone src="/landing/verify.png" alt="Halaman verifikasi wajah Blush" className="mx-auto w-44 md:w-56" />
        </div>
      </section>

      <section id="paket" className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <h2 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Paket dan harga</h2>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-ink-soft">
          Paket gratis sudah bisa dipakai penuh. Naikkan paket kalau butuh swipe tanpa batas dan ingin melihat siapa yang sudah suka duluan. Harga kami lebih hemat dari langganan aplikasi kencan populer.
        </p>
        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          {(["free", "plus", "gold"] as const).map((id) => {
            const p = PLANS[id];
            const highlight = id === "plus";
            return (
              <article
                key={id}
                className={`flex h-full flex-col rounded-card border p-4 ${highlight ? "border-blush-deep bg-paper" : "border-line bg-paper"}`}
              >
                <div className="flex min-h-9 flex-wrap items-start justify-between gap-x-2 gap-y-1">
                  <h3 className="text-base font-bold">{p.name}</h3>
                  {highlight ? (
                    <span className="max-w-full shrink-0 rounded-[999px] bg-blush-tint px-2 py-0.5 text-center text-2xs font-bold leading-5 text-blush-deep">
                      Paling sering dipilih
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 flex min-h-8 flex-wrap items-baseline gap-x-1 text-2xl font-bold tabular-nums">
                  {p.priceIdr === 0 ? "Rp0" : formatIdr(p.priceIdr)}
                  <span className="text-xs font-semibold text-ink-soft">/ {p.period}</span>
                  {p.compareAtIdr > p.priceIdr ? (
                    <span className="text-xs font-semibold text-ink-faint line-through">{formatIdr(p.compareAtIdr)}</span>
                  ) : null}
                </p>
                <ul className="mt-3 flex flex-1 flex-col gap-2 text-sm leading-5 text-ink-soft">
                  {p.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ok" strokeWidth={2.6} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`${highlight ? primary : secondary} mt-5 h-12 w-full shrink-0`}>
                  {id === "free" ? "Buat akun gratis" : id === "plus" ? "Mulai dengan Plus" : "Mulai dengan Gold"}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line bg-ink text-paper">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold">Siap kenalan?</p>
            <p className="mt-1 text-sm text-paper/80">Buat akun, isi satu menit, langsung lihat kartu pertama.</p>
          </div>
          <Link href="/signup" className="app-press inline-flex min-h-12 items-center justify-center rounded-[999px] bg-paper px-6 text-sm font-bold text-ink transition-colors hover:bg-blush-tint">
            Buat akun gratis
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-8">
        <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Wordmark size="md" />
            <p className="mt-2 max-w-[36ch] text-xs leading-relaxed text-ink-soft">
              Blush adalah aplikasi kencan untuk orang dewasa di Indonesia. Khusus 18 tahun ke atas.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold" aria-label="Tautan kaki halaman">
            <Link href="/privasi" className="text-ink-soft transition-colors hover:text-ink">Privasi</Link>
            <Link href="/syarat" className="text-ink-soft transition-colors hover:text-ink">Syarat</Link>
            <a href="#keamanan" className="text-ink-soft transition-colors hover:text-ink">Keamanan</a>
            <Link href="/login" className="text-ink-soft transition-colors hover:text-ink">Masuk</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { PLANS, PLAN_ORDER, formatIdr } from "@/lib/plans";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-[999px] bg-blush-deep px-6 py-3 text-sm font-semibold text-paper transition-colors duration-200 ease-out hover:bg-ink";
const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-[999px] border border-line-strong px-5 py-3 text-sm font-semibold text-ink transition-colors duration-200 ease-out hover:border-ink hover:bg-paper-2";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[999px] border border-line-strong bg-paper-2 px-3 py-1 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
      {children}
    </span>
  );
}

/** Diagram produk — bukan tangkapan layar palsu, bukan angka karangan. */
function ProductDiagram() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="rounded-card border border-line bg-paper p-4 shadow-[0_10px_28px_-18px_oklch(0.62_0.2_15)]">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-faint">Discovery</span>
          <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-faint">sisa kuota like</span>
        </div>
        <div className="mt-3 flex h-40 items-center justify-center rounded-[8px] bg-blush-tint text-sm font-semibold text-blush-deep">
          foto profil · jarak · minat
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-[999px] border border-line-strong px-3 py-1 text-xs font-semibold text-ink-soft">Lewati</span>
          <span className="rounded-[999px] bg-blush px-3 py-1 text-xs font-semibold text-paper">Suka</span>
          <span className="rounded-[999px] border border-line-strong px-3 py-1 text-xs font-semibold text-ink-soft">Superlike</span>
        </div>
      </div>
      <div className="ml-6 rounded-card border border-line bg-paper p-4">
        <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-faint">Match</span>
        <p className="mt-1 text-sm text-ink-soft">Kalau kalian berdua suka, room chat langsung terbuka.</p>
      </div>
      <div className="ml-12 rounded-card border border-line bg-paper p-4">
        <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-faint">Chat</span>
        <p className="mt-1 text-sm text-ink-soft">Realtime, dengan indikator belum dibaca.</p>
      </div>
    </div>
  );
}

function Split({
  side,
  eyebrow,
  title,
  proof,
  children,
}: {
  side: "left" | "right";
  eyebrow: string;
  title: string;
  proof: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line py-[var(--space-3xl)]">
      <div className="mx-auto grid max-w-6xl items-center gap-[var(--space-xl)] px-[var(--space-md)] md:grid-cols-2">
        <div className={side === "right" ? "md:order-2" : ""}>
          <Pill>{eyebrow}</Pill>
          <h2 className="mt-4">{title}</h2>
          <div className="mt-4 space-y-3 text-ink-soft">{children}</div>
        </div>
        <div className={`flex justify-center ${side === "right" ? "md:order-1 md:justify-start" : "md:justify-end"}`}>
          {proof}
        </div>
      </div>
    </section>
  );
}

/** Kartu contoh yang menampilkan bagian UI Blush sendiri (bukan testimoni, bukan angka). */
function ProofCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="w-full max-w-sm rounded-card border border-line bg-paper p-[var(--space-md)] shadow-[0_12px_30px_-22px_oklch(0.62_0.2_15)]">
      <span className="text-2xs font-semibold uppercase tracking-[0.1em] text-ink-faint">{title}</span>
      <ul className="mt-3 space-y-2 text-sm text-ink-soft">
        {lines.map((l) => (
          <li key={l} className="rounded-[8px] border border-line bg-paper-2 px-3 py-2">
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <header className="border-b border-line bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-[var(--space-md)] py-[var(--space-sm)]">
          <Link href="/" className="font-display text-lg font-bold tracking-[-0.03em]">
            Blush
          </Link>
          <nav className="flex items-center gap-[var(--space-sm)]">
            <a href="#cara-kerja" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:inline">
              Cara kerja
            </a>
            <a href="#harga" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:inline">
              Harga
            </a>
            <Link href="/login" className="text-sm font-semibold text-ink hover:text-blush-deep">
              Masuk
            </Link>
            <Link href="/signup" className={btnPrimary}>
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      {/* Split Studio — hero diptych */}
      <section className="mx-auto grid max-w-6xl items-center gap-[var(--space-xl)] px-[var(--space-md)] py-[var(--space-3xl)] md:grid-cols-2">
        <div>
          <Pill>Dating app web · gratis buat mulai</Pill>
          <h1 className="mt-[var(--space-md)] max-w-[14ch]">Kenalan yang nggak bikin capek.</h1>
          <p className="mt-[var(--space-md)] max-w-[46ch] text-lg text-ink-soft">
            Blush nunjukin profil yang memang cocok sama minat dan jarakmu, kasih kuota like yang jelas,
            dan buka chat begitu kalian saling suka. Nggak ada bot, nggak ada angka karangan.
          </p>
          <div className="mt-[var(--space-lg)] flex flex-wrap gap-[var(--space-sm)]">
            <Link href="/signup" className={btnPrimary}>
              Buat akun
            </Link>
            <a href="#cara-kerja" className={btnGhost}>
              Lihat cara kerjanya
            </a>
          </div>
          <ul className="mt-[var(--space-lg)] space-y-2 text-sm text-ink-soft">
            <li>Umur minimal 18 tahun, wajib verifikasi foto buat badge biru.</li>
            <li>Report &amp; block tersedia di setiap profil dan setiap chat.</li>
            <li>Lokasi presisi tidak pernah dibagikan mentah — hanya jarak kasar.</li>
          </ul>
        </div>
        <div className="flex justify-center md:justify-end">
          <ProductDiagram />
        </div>
      </section>

      <section id="cara-kerja" className="border-t border-line bg-paper-2 py-[var(--space-3xl)]">
        <div className="mx-auto max-w-6xl px-[var(--space-md)]">
          <Pill>Cara kerja</Pill>
          <h2 className="mt-4 max-w-[22ch]">Tiga langkah, semuanya kelihatan di layar.</h2>
          <div className="mt-[var(--space-xl)] grid gap-[var(--space-md)] md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Isi profil, sebut minatmu",
                d: "Nama, tanggal lahir, minat, dan minimal satu foto. Selesai dalam dua menit.",
              },
              {
                n: "02",
                t: "Swipe dengan kuota yang jelas",
                d: "Counter like harian tampil di atas deck, jadi kamu tahu persis sisa kuotanya.",
              },
              {
                n: "03",
                t: "Match, lalu ngobrol",
                d: "Like timbal balik langsung bikin room chat. Realtime, tanpa reload.",
              },
            ].map((s) => (
              <article key={s.n} className="rounded-card border border-line bg-paper p-[var(--space-md)] transition-transform duration-200 ease-out hover:-translate-y-0.5">
                <span className="text-2xs font-semibold uppercase tracking-[0.1em] text-blush-deep">{s.n}</span>
                <h3 className="mt-2">{s.t}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Split
        side="right"
        eyebrow="Swipe"
        title="Like, lewati, superlike — dan bisa dibatalkan."
        proof={
          <ProofCard
            title="Deck"
            lines={[
              "Filter aktif: 20–38 tahun · dalam 50 km",
              "Sisa like hari ini ditampilkan sebelum kamu geser",
              "Undo swipe terakhir, tanpa batas waktu",
            ]}
          />
        }
      >
        <p>
          Deck Blush cuma menampilkan profil yang lolos filtermu: umur, jarak, gender, dan niat (serius,
          santai, atau cari teman). Profil yang sudah kamu swipe tidak akan muncul lagi.
        </p>
        <p>Undo swipe terakhir tersedia dari menu deck, jadi salah geser bukan masalah.</p>
      </Split>

      <Split
        side="left"
        eyebrow="Safety"
        title="Verifikasi foto, report, block — bawaan, bukan tambahan."
        proof={
          <ProofCard
            title="Keamanan"
            lines={[
              "Selfie verifikasi dikirim manual untuk direview",
              "Report masuk antrean review, status bisa dicek",
              "Block menyembunyikan kalian berdua dari deck & chat",
            ]}
          />
        }
      >
        <p>
          Kirim satu selfie, tim kami cek manual, lalu badge terverifikasi muncul di profilmu. Profil yang
          dilaporkan masuk antrean review dan bisa dibatasi.
        </p>
        <p>Block langsung menyembunyikan kalian berdua dari deck dan chat.</p>
      </Split>

      <section id="harga" className="border-t border-line bg-paper-2 py-[var(--space-3xl)]">
        <div className="mx-auto max-w-6xl px-[var(--space-md)]">
          <Pill>Harga</Pill>
          <h2 className="mt-4 max-w-[24ch]">Gratisnya benar-benar bisa dipakai. Naik paket kalau butuh lebih.</h2>
          <div className="mt-[var(--space-xl)] grid gap-[var(--space-md)] md:grid-cols-3">
            {PLAN_ORDER.map((id) => {
              const plan = PLANS[id];
              return (
                <article
                  key={id}
                  className={`flex flex-col rounded-card border bg-paper p-[var(--space-lg)] ${
                    id === "plus" ? "border-blush-deep shadow-[0_14px_34px_-22px_oklch(0.62_0.2_15)]" : "border-line"
                  }`}
                >
                  <h3>{plan.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{plan.tagline}</p>
                  <p className="mt-[var(--space-md)] font-display text-2xl font-bold">
                    {plan.priceIdr === 0 ? "Gratis" : formatIdr(plan.priceIdr)}
                    <span className="ml-2 text-sm font-medium text-ink-faint">{plan.period}</span>
                  </p>
                  <ul className="mt-[var(--space-md)] flex-1 space-y-2 text-sm text-ink-soft">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link href="/signup" className={`${id === "free" ? btnGhost : btnPrimary} mt-[var(--space-lg)]`}>
                    {id === "free" ? "Mulai gratis" : `Pilih ${plan.name}`}
                  </Link>
                </article>
              );
            })}
          </div>
          <p className="mt-[var(--space-md)] text-sm text-ink-faint">
            Pembayaran pakai QRIS. Paket aktif setelah pembayaran terverifikasi.
          </p>
        </div>
      </section>

      <section className="py-[var(--space-3xl)]">
        <div className="mx-auto max-w-3xl px-[var(--space-md)] text-center">
          <h2 className="mx-auto max-w-[26ch]">Siap lihat siapa yang ada di sekitarmu?</h2>
          <Link href="/signup" className={`${btnPrimary} mt-[var(--space-lg)]`}>
            Buat akun Blush
          </Link>
        </div>
      </section>

      <footer className="border-t border-line bg-ink py-[var(--space-2xl)] text-paper">
        <div className="mx-auto max-w-6xl px-[var(--space-md)]">
          <p className="font-display text-2xl font-bold">Blush</p>
          <p className="mt-2 max-w-[52ch] text-sm text-paper/80">
            Dibuat untuk orang yang mau kenalan tanpa drama. Kalau ada yang tidak beres di aplikasi ini,
            laporkan lewat menu bantuan di dalam akunmu.
          </p>
          <div className="mt-[var(--space-lg)] flex flex-wrap gap-[var(--space-md)] text-sm">
            <Link href="/signup" className="hover:text-pear">
              Daftar
            </Link>
            <Link href="/login" className="hover:text-pear">
              Masuk
            </Link>
            <a href="#harga" className="hover:text-pear">
              Harga
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

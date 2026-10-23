import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/AdminPageHeader";
import { Icon } from "@/components/Icon";

export const instant = false;
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminOverviewPage() {
  const supabase = await createServerSupabase();
  const [{ count: pendingPayments }, { count: pendingVerify }, { count: openReports }] = await Promise.all([
    supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_verified", "pending"),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);

  const cards = [
    {
      href: "/admin/pembayaran",
      label: "Pembayaran menunggu",
      value: pendingPayments ?? 0,
      note: "Transaksi QRIS yang belum dikonfirmasi.",
      icon: "wallet" as const,
      cta: "Buka pembayaran",
    },
    {
      href: "/admin/verifikasi",
      label: "Verifikasi menunggu",
      value: pendingVerify ?? 0,
      note: "Akun yang menunggu review verifikasi.",
      icon: "shield" as const,
      cta: "Buka verifikasi",
    },
    {
      href: "/admin/laporan",
      label: "Laporan terbuka",
      value: openReports ?? 0,
      note: "Laporan yang perlu ditinjau.",
      icon: "flag" as const,
      cta: "Buka laporan",
    },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Blush admin"
        title="Ringkasan"
        description="Pantau hal yang perlu ditindak hari ini, lalu buka halaman yang sesuai. Setiap bagian punya halaman sendiri supaya tidak menumpuk di satu layar."
      >
        <Link href="/admin/aktivitas" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-paper">
          <Icon name="pulse" className="h-4 w-4" />
          Buka aktivitas
        </Link>
      </AdminPageHeader>

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Ringkasan operasional">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="group rounded-card border border-line bg-paper p-5 transition-colors hover:border-ink/30">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold leading-5 text-ink-soft">{card.label}</p>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-soft ring-1 ring-line">
                <Icon name={card.icon} className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 font-display text-4xl font-bold leading-none tabular-nums text-ink">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-ink-soft">{card.note}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ink-soft group-hover:text-ink">
              {card.cta}
              <Icon name="chevron" className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2">
        <Link href="/admin/aktivitas" className="rounded-card border border-line bg-paper p-5 transition-colors hover:border-ink/30">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Aktivitas pengunjung</p>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-soft ring-1 ring-line"><Icon name="pulse" className="h-4 w-4" /></span>
          </div>
          <p className="mt-1 text-sm leading-6 text-ink-soft">Sesi, IP tersamarkan, klik tautan, dan perangkat yang sedang aktif.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">Buka aktivitas <Icon name="chevron" className="h-3.5 w-3.5" /></span>
        </Link>
        <Link href="/admin/notifikasi" className="rounded-card border border-line bg-paper p-5 transition-colors hover:border-ink/30">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Kirim notifikasi</p>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-soft ring-1 ring-line"><Icon name="bell" className="h-4 w-4" /></span>
          </div>
          <p className="mt-1 text-sm leading-6 text-ink-soft">Kirim pengumuman atau promosi ke perangkat yang berlangganan.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">Buka notifikasi <Icon name="chevron" className="h-3.5 w-3.5" /></span>
        </Link>
      </section>
    </>
  );
}

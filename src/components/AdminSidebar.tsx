"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminSignOut from "@/components/AdminSignOut";
import { Icon, type IconName } from "@/components/Icon";

const GROUPS: { label: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    label: "Utama",
    items: [{ href: "/admin", label: "Ringkasan", icon: "deck" }],
  },
  {
    label: "Pantau",
    items: [
      { href: "/admin/aktivitas", label: "Aktivitas", icon: "pulse" },
      { href: "/admin/aktivitas/tautan", label: "Tautan", icon: "flag" },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/admin/pembayaran", label: "Pembayaran", icon: "wallet" },
      { href: "/admin/verifikasi", label: "Verifikasi", icon: "shield" },
      { href: "/admin/laporan", label: "Laporan", icon: "chart" },
    ],
  },
  {
    label: "Komunikasi",
    items: [{ href: "/admin/notifikasi", label: "Notifikasi", icon: "bell" }],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/admin" || href === "/admin/aktivitas" ? pathname === href : pathname.startsWith(href);

  const nav = (compact: boolean) => (
    <nav aria-label="Navigasi admin" className={compact ? "grid grid-cols-2 gap-1.5 pb-1" : "flex flex-col gap-6"}>
      {GROUPS.map((group) => (
        <div key={group.label} className={compact ? "contents" : ""}>
          {!compact ? <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.10em] text-ink-soft">{group.label}</p> : null}
          <div className={compact ? "contents" : "flex flex-col gap-1"}>
            {group.items.map((item) => {
              const isActive = active(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  aria-current={isActive ? "page" : undefined}
                  className={
                    compact
                      ? `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-semibold ${item.href === "/admin/notifikasi" ? "col-span-2" : ""} ${isActive ? "bg-ink text-paper" : "border border-line bg-paper text-ink-soft"}`
                      : `flex min-h-11 items-center gap-3 rounded-[9px] px-3 text-[13px] font-medium leading-5 ${isActive ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-2 hover:text-ink"}`
                  }
                >
                  <Icon name={item.icon} className={`h-4 w-4 shrink-0 ${isActive ? "opacity-90" : "opacity-70"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <div className="border-b border-line bg-paper px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-lg font-bold tracking-[-0.03em]">blush admin</span>
          <Link href="/app/discover" className="text-xs font-semibold text-ink-soft">Buka app</Link>
        </div>
        <div className="mt-3">{nav(true)}</div>
      </div>

      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line bg-paper px-3 py-5 lg:flex">
        <div className="px-3">
          <p className="font-display text-2xl font-bold tracking-[-0.04em]">blush</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Admin console</p>
        </div>
        <div className="mt-9 flex-1">
          {nav(false)}
        </div>
        <div className="border-t border-line px-1 pt-3">
          <Link href="/app/discover" className="flex min-h-10 items-center gap-3 rounded-[8px] px-3 text-[13px] font-medium text-ink-soft hover:bg-paper-2 hover:text-ink">
            <Icon name="chevron" className="h-4 w-4 rotate-180 opacity-70" />
            Kembali ke aplikasi
          </Link>
          <AdminSignOut />
          <p className="mt-3 px-3 text-[11px] leading-5 text-ink-faint">Data pengunjung disamarkan. Akses hanya untuk admin.</p>
        </div>
      </aside>
    </>
  );
}

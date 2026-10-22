"use client";

import { useEffect, useState } from "react";
import AdminSignOut from "@/components/AdminSignOut";

const GROUPS = [
  {
    label: "Pantau",
    items: [
      ["#aktivitas", "Aktivitas"],
      ["#notifikasi", "Notifikasi"],
    ],
  },
  {
    label: "Operasional",
    items: [
      ["#pembayaran", "Pembayaran"],
      ["#verifikasi", "Verifikasi"],
      ["#laporan", "Laporan"],
    ],
  },
] as const;

export default function AdminSidebar() {
  const [active, setActive] = useState("#aktivitas");

  useEffect(() => {
    function read() {
      const id = window.location.hash;
      if (id) setActive(id);
    }
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const nav = (compact: boolean) => (
    <nav aria-label="Navigasi admin" className={compact ? "flex gap-1 overflow-x-auto pb-1" : "flex flex-col gap-5"}>
      {GROUPS.map((group) => (
        <div key={group.label} className={compact ? "contents" : ""}>
          {!compact ? <p className="mb-1.5 px-2 text-2xs font-semibold uppercase tracking-[0.14em] text-ink-faint">{group.label}</p> : null}
          <div className={compact ? "flex gap-1" : "flex flex-col gap-0.5"}>
            {group.items.map(([href, label]) => {
              const isActive = active === href;
              return (
                <a
                  key={href}
                  href={href}
                  onClick={() => setActive(href)}
                  aria-current={isActive ? "location" : undefined}
                  className={
                    compact
                      ? `inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-semibold ${isActive ? "bg-ink text-paper" : "border border-line bg-paper text-ink-soft"}`
                      : `flex min-h-10 items-center rounded-[9px] px-2.5 text-sm font-medium ${isActive ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-2 hover:text-ink"}`
                  }
                >
                  {label}
                </a>
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
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-lg font-bold tracking-[-0.03em]">blush admin</span>
          <a href="/app/discover" className="text-xs font-semibold text-ink-soft">Buka app</a>
        </div>
        <div className="mt-2">{nav(true)}</div>
      </div>

      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-paper px-3 py-5 lg:flex">
        <div className="px-2">
          <p className="font-display text-2xl font-bold tracking-[-0.04em]">blush</p>
          <p className="mt-0.5 text-2xs font-semibold uppercase tracking-[0.16em] text-ink-faint">Admin console</p>
        </div>
        <div className="mt-8 flex-1">
          {nav(false)}
        </div>
        <div className="border-t border-line pt-3">
          <a href="/app/discover" className="flex min-h-9 items-center rounded-[8px] px-2 text-xs font-semibold text-ink-soft hover:bg-paper-2 hover:text-ink">
            Kembali ke aplikasi
          </a>
          <AdminSignOut />
          <p className="mt-2 px-2 text-2xs text-ink-faint">Data pengunjung disamarkan. Akses hanya untuk admin.</p>
        </div>
      </aside>
    </>
  );
}

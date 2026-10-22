"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app/discover", label: "Temukan" },
  { href: "/app/likes", label: "Suka" },
  { href: "/app/matches", label: "Chat" },
  { href: "/app/profile", label: "Profil" },
];

/** Nav desktop dengan status aktif — tanpa ini semua tab terlihat sama. */
export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
      {LINKS.map((l) => {
        // Halaman pengaturan, verifikasi, dan paket tetap di bawah tab Profil.
        const extra = l.href === "/app/profile" && ["/app/settings", "/app/verify", "/app/premium"].some((p) => pathname.startsWith(p));
        const active = pathname === l.href || pathname.startsWith(l.href + "/") || extra;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-[999px] px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${
              active ? "bg-paper-2 text-ink" : "text-ink-soft hover:bg-paper-2 hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

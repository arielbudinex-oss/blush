"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app/discover", label: "Jelajah", icon: "deck" },
  { href: "/app/likes", label: "Suka", icon: "heart" },
  { href: "/app/matches", label: "Chat", icon: "chat" },
  { href: "/app/profile", label: "Profil", icon: "user" },
] as const;

function TabIcon({ name }: { name: (typeof ITEMS)[number]["icon"] }) {
  const common = { viewBox: "0 0 24 24", className: "h-6 w-6", "aria-hidden": true } as const;
  if (name === "heart")
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinejoin="round">
        <path d="M12 20s-7-4.35-7-9.2A4.3 4.3 0 0112 7.6a4.3 4.3 0 017 3.2C19 15.65 12 20 12 20z" />
      </svg>
    );
  if (name === "chat")
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1.2-4.2A8 8 0 1121 12z" />
      </svg>
    );
  if (name === "user")
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
        <circle cx="12" cy="8.5" r="3.4" />
        <path d="M5 20c1.2-3.4 3.8-5.2 7-5.2s5.8 1.8 7 5.2" />
      </svg>
    );
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4.5h10.5a1.5 1.5 0 011.5 1.5v9" />
      <path d="M4.5 8.5A1.5 1.5 0 016 7h9a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0115 19H6a1.5 1.5 0 01-1.5-1.5z" />
    </svg>
  );
}

/** Navigasi bawah untuk layar kecil; tab aktif punya indikator pegas. */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="tabbar fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.icon === "chat" && pathname.startsWith("/app/chat"));
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 py-1.5 text-2xs font-bold transition-colors duration-200 ${
                  active ? "text-blush-deep" : "text-ink-soft"
                }`}
              >
                <span
                  className={`grid h-8 w-14 place-items-center rounded-[999px] transition-colors duration-200 ${
                    active ? "bg-blush-tint" : "bg-transparent"
                  }`}
                >
                  <TabIcon name={item.icon} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

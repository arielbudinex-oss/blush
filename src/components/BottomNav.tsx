"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";

const TABS: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: "/app/discover", label: "Temukan", icon: "deck", match: ["/app/discover"] },
  { href: "/app/likes", label: "Suka", icon: "heart", match: ["/app/likes"] },
  { href: "/app/matches", label: "Chat", icon: "chat", match: ["/app/matches", "/app/chat"] },
  { href: "/app/profile", label: "Profil", icon: "user", match: ["/app/profile"] },
];

/** Navigasi bawah untuk layar kecil; tab aktif punya indikator pegas. */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="tabbar safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 px-1">
        {TABS.map((tab) => {
          const active = tab.match.some((p) => pathname === p || pathname.startsWith(p + "/"));
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-[3.75rem] flex-col items-center justify-center gap-1 pb-1 pt-1.5"
              >
                <span
                  className={`grid h-8 w-14 place-items-center rounded-full transition-colors duration-150 ${
                    active ? "bg-blush-tint text-blush-deep" : "text-ink-soft"
                  }`}
                >
                  <Icon name={tab.icon} className="h-[21px] w-[21px]" filled={active && tab.icon === "heart"} />
                </span>
                <span className={`text-2xs font-semibold leading-none ${active ? "text-blush-deep" : "text-ink"}`}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

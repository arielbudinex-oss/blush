"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";

const TABS: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: "/app/discover", label: "Temukan", icon: "deck", match: ["/app/discover"] },
  { href: "/app/likes", label: "Suka", icon: "heart", match: ["/app/likes"] },
  { href: "/app/matches", label: "Chat", icon: "chat", match: ["/app/matches", "/app/chat"] },
  { href: "/app/profile", label: "Profil", icon: "user", match: ["/app/profile"] },
];

function TabLink({
  tab,
  active,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <Link
      href={tab.href}
      prefetch
      aria-current={active ? "page" : undefined}
      aria-busy={pending || undefined}
      className={`flex min-h-[3.5rem] touch-manipulation select-none flex-col items-center justify-center gap-0.5 rounded-[12px] pb-1 pt-1.5 transition-opacity active:bg-paper-2 ${
        pending ? "opacity-60" : "opacity-100"
      }`}
    >
      <span
        className={`grid h-8 w-14 place-items-center transition-colors duration-150 ${
          active ? "text-blush-deep" : "text-ink-soft"
        }`}
      >
        <Icon name={tab.icon} className="h-[21px] w-[21px]" filled={active && tab.icon === "heart"} />
      </span>
      <span className={`text-2xs font-semibold leading-none ${active ? "text-blush-deep" : "text-ink-soft"}`}>
        {tab.label}
      </span>
    </Link>
  );
}

/** Navigasi bawah; padding ekstra supaya tidak tertutup toolbar browser di HP. */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="tabbar fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/95 pt-0.5 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 px-1">
        {TABS.map((tab) => {
          const active = tab.match.some((p) => pathname === p || pathname.startsWith(p + "/"));
          return (
            <li key={tab.href}>
              <TabLink tab={tab} active={active} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

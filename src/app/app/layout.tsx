import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/discover");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarded_at, plan, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded_at) redirect("/onboarding");

  const links = [
    { href: "/app/discover", label: "Jelajah" },
    { href: "/app/likes", label: "Likes" },
    { href: "/app/matches", label: "Chat" },
    { href: "/app/profile", label: "Profil" },
  ];

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-[var(--space-md)]">
          <Link href="/app/discover" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-blush-deep text-paper">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-current">
                <path d="M12 20s-7-4.35-7-9.2A4.3 4.3 0 0112 7.6a4.3 4.3 0 017 3.2C19 15.65 12 20 12 20z" />
              </svg>
            </span>
            <span className="font-display text-lg font-bold tracking-[-0.03em]">Blush</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-[999px] px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors duration-200 hover:bg-paper-2 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/app/premium"
              className="inline-flex min-h-11 items-center rounded-[999px] border border-line-strong px-3.5 text-xs font-semibold text-ink app-press hover:border-ink hover:bg-paper-2"
            >
              {profile.plan === "free" ? "Blush Plus" : profile.plan === "gold" ? "Blush Gold" : "Blush Plus"}
            </Link>
          </div>
        </div>
      </header>
      <main className="app-main flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}

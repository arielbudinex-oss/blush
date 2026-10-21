import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { Icon } from "@/components/Icon";

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
    .select("display_name, onboarded_at, plan, is_verified, last_active_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded_at) redirect("/onboarding");

  // Presence: tandai aktif paling sering tiap 2 menit, jangan tulis tiap navigasi.
  const stale = !profile.last_active_at || Date.now() - new Date(profile.last_active_at).getTime() > 120_000;
  if (stale) {
    await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", user.id);
  }

  const links = [
    { href: "/app/discover", label: "Jelajah" },
    { href: "/app/likes", label: "Suka" },
    { href: "/app/matches", label: "Chat" },
    { href: "/app/profile", label: "Profil" },
  ];

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-[var(--space-md)]">
          <Link href="/app/discover" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-blush-deep text-paper">
              <Icon name="heart" className="h-4 w-4" filled />
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
              {profile.plan === "gold" ? "Blush Gold" : profile.plan === "plus" ? "Blush Plus" : "Upgrade"}
            </Link>
          </div>
        </div>
      </header>
      <main className="app-main flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}

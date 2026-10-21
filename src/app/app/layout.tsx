import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

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
    .select("display_name, onboarded_at, plan")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded_at) redirect("/onboarding");

  const links = [
    { href: "/app/discover", label: "Discover" },
    { href: "/app/likes", label: "Likes" },
    { href: "/app/matches", label: "Matches" },
    { href: "/app/profile", label: "Profil" },
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-[var(--space-md)] py-[var(--space-sm)]">
          <Link href="/app/discover" className="font-display text-lg font-bold tracking-[-0.03em]">
            Blush
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-[999px] px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors duration-200 hover:bg-paper-2 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/app/premium"
              className="rounded-[999px] border border-blush-deep px-3 py-1.5 text-sm font-semibold text-blush-deep transition-colors duration-200 hover:bg-blush-tint"
            >
              {profile.plan === "free" ? "Premium" : `Paket ${profile.plan}`}
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

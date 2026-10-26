import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/me";
import { photoUrl } from "@/lib/photo";
import BottomNav from "@/components/BottomNav";
import AppNav from "@/components/AppNav";
import AutoLocation from "@/components/AutoLocation";
import Logo from "@/components/Logo";
import HeaderAvatar from "@/components/HeaderAvatar";
import NotificationGate from "@/components/NotificationGate";
import PushAuto from "@/components/PushAuto";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await getMe();
  if (!user) redirect("/login?next=/app/discover");
  if (!profile?.onboarded_at) redirect("/onboarding");

  const photos = (profile.photos ?? [])
    .slice()
    .sort((a, b) => a.position - b.position);
  const cover = photos.map((p) => photoUrl(p.storage_path)).find(Boolean) ?? null;
  const initial = (profile.display_name || "B").trim().charAt(0).toUpperCase() || "B";

  // Presence: tandai aktif paling sering tiap 2 menit, jangan tulis tiap navigasi.
  const stale = !profile.last_active_at || Date.now() - new Date(profile.last_active_at).getTime() > 120_000;
  if (stale) {
    await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", user.id);
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-2 px-[var(--space-md)]">
          <Logo size="md" href="/app/discover" />
          <AppNav />
          <HeaderAvatar cover={cover} initial={initial} />
        </div>
      </header>
      <main className="app-main flex-1">
        {profile.location ? null : <AutoLocation userId={user.id} />}
        <NotificationGate />
        <PushAuto />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { PLANS, type Plan } from "@/lib/plans";
import ProfileForm from "@/components/ProfileForm";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/profile");

  const [{ data: profile }, { data: photos }, { data: interests }, { data: picked }, { data: prefs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, birthdate, gender, bio, job, city, intent, is_verified, plan")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("photos").select("id, storage_path, position").eq("profile_id", user.id).order("position"),
    supabase.from("interests").select("id, slug, label").order("label"),
    supabase.from("profile_interests").select("interest_id").eq("profile_id", user.id),
    supabase.from("preferences").select("min_age, max_age, max_distance_km, show_gender").eq("user_id", user.id).maybeSingle(),
  ]);

  if (!profile) redirect("/onboarding");
  const plan = (profile.plan ?? "free") as Plan;

  return (
    <main className="mx-auto w-full max-w-3xl px-[var(--space-md)] py-[var(--space-lg)]">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl">Profil kamu</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Paket aktif: <strong>{PLANS[plan].name}</strong>
          </p>
        </div>
        <Link href="/app/settings" className="text-sm font-semibold text-blush-deep">
          Pengaturan keamanan
        </Link>
      </div>

      <div className="mt-[var(--space-lg)]">
        <ProfileForm
          userId={user.id}
          profile={profile as never}
          photos={photos ?? []}
          interests={interests ?? []}
          pickedInterests={(picked ?? []).map((p: { interest_id: number }) => p.interest_id)}
          preferences={
            (prefs as { min_age: number; max_age: number; max_distance_km: number; show_gender: string[] }) ?? {
              min_age: 18,
              max_age: 45,
              max_distance_km: 50,
              show_gender: ["woman", "man"],
            }
          }
        />
      </div>
    </main>
  );
}

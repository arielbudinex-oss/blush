import { createServerSupabase } from "@/lib/supabase/server";
import { PLANS, type Plan } from "@/lib/plans";
import SwipeDeck, { type Candidate } from "@/components/SwipeDeck";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ fokus?: string }>;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { fokus } = await searchParams;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    { data: candidates },
    { data: likesUsed },
    { data: profile },
    { data: myInterestRows },
    { data: interestRows },
    { count: superUsed },
    { count: swipeCount },
  ] = await Promise.all([
    supabase.rpc("discover_candidates", { p_limit: 20 }),
    supabase.rpc("likes_used_today"),
    supabase
      .from("profiles")
      .select("plan, is_verified, preferences(min_age, max_age, max_distance_km, show_gender, verified_only, search_lat, search_lng)")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase.from("profile_interests").select("interest_id").eq("profile_id", user!.id),
    supabase.from("interests").select("id, label"),
    supabase
      .from("swipes")
      .select("id", { count: "exact", head: true })
      .eq("actor_id", user!.id)
      .eq("action", "superlike")
      .gte("created_at", startOfDay.toISOString()),
    supabase.from("swipes").select("id", { count: "exact", head: true }).eq("actor_id", user!.id),
  ]);

  const plan = (profile?.plan ?? "free") as Plan;
  const quota = PLANS[plan] ?? PLANS.free;
  const prefRow = (
    profile as {
      preferences?: {
        min_age: number;
        max_age: number;
        max_distance_km: number;
        show_gender: string[];
        verified_only: boolean;
        search_lat: number | null;
        search_lng: number | null;
      } | null;
    } | null
  )?.preferences;
  const prefs = prefRow ?? {
    min_age: 18,
    max_age: 45,
    max_distance_km: 50,
    show_gender: ["woman", "man"],
    verified_only: false,
    search_lat: null,
    search_lng: null,
  };

  // Dari halaman "Yang suka kamu": orang itu tampil paling depan, bukan kartu acak.
  const list = ((candidates ?? []) as Candidate[]).slice();
  if (fokus) {
    const at = list.findIndex((c) => c.id === fokus);
    if (at > 0) list.unshift(...list.splice(at, 1));
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-[var(--space-md)] py-[var(--space-lg)]">
      <SwipeDeck
        candidates={list}
        likesUsed={Number(likesUsed ?? 0)}
        dailyLikes={quota.dailyLikes}
        superlikesLeft={Math.max(0, quota.dailySuperlikes - Number(superUsed ?? 0))}
        isVerified={profile?.is_verified === "approved"}
        hasSwipes={(swipeCount ?? 0) > 0}
        myInterests={(interestRows ?? [])
          .filter((i: { id: number }) => new Set((myInterestRows ?? []).map((r: { interest_id: number }) => r.interest_id)).has(i.id))
          .map((i: { label: string }) => i.label)}
        prefs={prefs}
        gold={plan === "gold"}
      />
    </main>
  );
}

import { createServerSupabase } from "@/lib/supabase/server";
import { PLANS, type Plan } from "@/lib/plans";
import SwipeDeck, { type Candidate } from "@/components/SwipeDeck";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function DiscoverPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: candidates }, { data: likesUsed }, { data: profile }] = await Promise.all([
    supabase.rpc("discover_candidates", { p_limit: 20 }),
    supabase.rpc("likes_used_today"),
    supabase.from("profiles").select("plan, is_verified").eq("id", user!.id).maybeSingle(),
  ]);

  const plan = (profile?.plan ?? "free") as Plan;
  const quota = PLANS[plan] ?? PLANS.free;

  return (
    <main className="mx-auto w-full max-w-5xl px-[var(--space-md)] py-[var(--space-lg)]">
      <SwipeDeck
        candidates={(candidates ?? []) as Candidate[]}
        likesUsed={Number(likesUsed ?? 0)}
        dailyLikes={quota.dailyLikes}
        isVerified={profile?.is_verified === "approved"}
      />
    </main>
  );
}

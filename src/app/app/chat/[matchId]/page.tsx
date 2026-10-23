import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { photoUrl } from "@/lib/photo";
import Chat from "@/components/Chat";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: match } = await supabase
    .from("matches")
    .select("id, user_a, user_b, unmatched_by, created_at, expires_at, extended_at")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) notFound();
  const meId = user!.id;
  if (match.user_a !== meId && match.user_b !== meId) notFound();
  if (match.unmatched_by) {
    return (
      <main className="mx-auto w-full max-w-2xl px-[var(--space-md)] py-[var(--space-xl)]">
        <h1 className="text-2xl">Room ini sudah ditutup</h1>
        <p className="mt-2 text-sm text-ink-soft">Salah satu pihak membatalkan match, jadi chat tidak bisa dilanjutkan.</p>
      </main>
    );
  }

  const otherId = match.user_a === meId ? match.user_b : match.user_a;
  const { data: other } = await supabase
    .from("profiles")
    .select("display_name, last_active_at, birthdate, bio, job, city, intent, is_verified")
    .eq("id", otherId)
    .maybeSingle();
  const [{ data: mine }, { data: theirs }] = await Promise.all([
    supabase.from("profile_interests").select("interest_id").eq("profile_id", meId),
    supabase.from("profile_interests").select("interest_id").eq("profile_id", otherId),
  ]);
  const theirsSet = new Set((theirs ?? []).map((r: { interest_id: number }) => r.interest_id));
  const sharedIds = (mine ?? []).map((r: { interest_id: number }) => r.interest_id).filter((id: number) => theirsSet.has(id));
  const { data: sharedRows } = sharedIds.length
    ? await supabase.from("interests").select("label").in("id", sharedIds).limit(4)
    : { data: [] as { label: string }[] };

  const { data: photo } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("profile_id", otherId)
    .order("position")
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-2xl px-[var(--space-md)] py-[var(--space-md)]">
      <Chat
        matchId={matchId}
        meId={meId}
        otherId={otherId}
        otherName={other?.display_name ?? ""}
        otherPhoto={photoUrl(photo?.storage_path)}
        otherActiveAt={other?.last_active_at ?? null}
        expiresAt={
          match.expires_at ??
          new Date(new Date(match.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
        }
        extendedAt={match.extended_at}
        sharedInterests={(sharedRows ?? []).map((r: { label: string }) => r.label)}
        otherAge={other?.birthdate ? Math.floor((Date.now() - new Date(`${other.birthdate}T00:00:00Z`).getTime()) / 31_557_600_000) : null}
        otherBio={other?.bio ?? ""}
        otherJob={other?.job ?? ""}
        otherCity={other?.city ?? ""}
        otherIntent={other?.intent ?? "dating"}
        otherVerified={other?.is_verified === "approved"}
      />
    </main>
  );
}

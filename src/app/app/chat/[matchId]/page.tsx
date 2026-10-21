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
    .select("id, user_a, user_b, unmatched_by")
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
    .select("display_name, last_active_at")
    .eq("id", otherId)
    .maybeSingle();
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
      />
    </main>
  );
}

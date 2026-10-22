import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { pushToUsers } from "@/lib/push";

/** Notifikasi pesan baru. Dicek dulu bahwa pengirim memang peserta match. */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { matchId?: unknown; text?: unknown };
  const matchId = typeof body.matchId === "string" ? body.matchId : "";
  if (!matchId) return NextResponse.json({ error: "Match tidak valid." }, { status: 400 });

  const admin = createAdminSupabase();
  const { data: match } = await admin
    .from("matches")
    .select("id, user_a, user_b, unmatched_by")
    .eq("id", matchId)
    .maybeSingle();
  if (!match || (match.user_a !== user.id && match.user_b !== user.id) || match.unmatched_by) {
    return NextResponse.json({ error: "Match tidak ditemukan." }, { status: 404 });
  }

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;
  const { data: me } = await admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const preview = typeof body.text === "string" ? body.text.trim().slice(0, 90) : "";

  const result = await pushToUsers([otherId], {
    title: `Pesan baru dari ${me?.display_name || "match kamu"}`,
    body: preview || "Buka Blush untuk membalas.",
    url: `/app/chat/${matchId}`,
    tag: `chat-${matchId}`,
  });

  return NextResponse.json({ ok: true, ...result });
}

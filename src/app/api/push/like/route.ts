import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { pushToUsers } from "@/lib/push";

/** Dipanggil setelah swipe sukses; server memverifikasi like benar-benar tersimpan. */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { targetId?: unknown };
  const targetId = typeof body.targetId === "string" ? body.targetId : "";
  if (!targetId || targetId === user.id) return NextResponse.json({ error: "Target tidak valid." }, { status: 400 });

  const admin = createAdminSupabase();
  const { data: swipe } = await admin
    .from("swipes")
    .select("action")
    .eq("actor_id", user.id)
    .eq("target_id", targetId)
    .maybeSingle();
  if (!swipe || (swipe.action !== "like" && swipe.action !== "superlike")) {
    return NextResponse.json({ error: "Like belum tersimpan." }, { status: 400 });
  }

  const [{ data: me }, { data: targetSwipe }] = await Promise.all([
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    admin
      .from("swipes")
      .select("action")
      .eq("actor_id", targetId)
      .eq("target_id", user.id)
      .maybeSingle(),
  ]);
  const matched = targetSwipe?.action === "like" || targetSwipe?.action === "superlike";
  const name = me?.display_name || "Seseorang";

  const result = await pushToUsers([targetId], {
    title: matched ? "Kalian saling suka" : "Ada yang suka profilmu",
    body: matched ? `${name} juga menyukai profilmu. Chat sudah terbuka.` : "Buka Blush untuk melihat siapa yang suka duluan.",
    url: matched ? "/app/matches" : "/app/likes",
    tag: matched ? "match" : "like",
  });

  return NextResponse.json({ ok: true, ...result });
}

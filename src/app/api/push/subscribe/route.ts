import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

/** Simpan langganan push milik user yang sedang masuk. */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  const endpoint = typeof body.endpoint === "string" ? body.endpoint.slice(0, 1000) : "";
  const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh.slice(0, 300) : "";
  const auth = typeof body.keys?.auth === "string" ? body.keys.auth.slice(0, 100) : "";
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Langganan tidak lengkap." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: (request.headers.get("user-agent") ?? "").slice(0, 300),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Hapus langganan saat user mematikan notifikasi di browser. */
export async function DELETE(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { endpoint?: unknown };
  if (typeof body.endpoint !== "string") return NextResponse.json({ error: "Endpoint wajib." }, { status: 400 });

  const admin = createAdminSupabase();
  await admin.from("push_subscriptions").delete().eq("endpoint", body.endpoint).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

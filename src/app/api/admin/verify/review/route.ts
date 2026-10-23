import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

/** Admin menyetujui / menolak verifikasi foto. Menyetujui memasang badge terverifikasi. */
export async function POST(request: Request) {
  const supabase = await createServerSupabase("admin");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "Hanya admin." }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { userId?: string; action?: string };
  if (!body.userId || !["approve", "reject"].includes(body.action ?? "")) {
    return NextResponse.json({ error: "userId dan action (approve|reject) wajib." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("profiles")
    .update({ is_verified: body.action === "approve" ? "approved" : "rejected" })
    .eq("id", body.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { pushToAll } from "@/lib/push";

/** Promosi atau pengumuman dari admin ke semua perangkat yang berlangganan. */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "Hanya admin." }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { title?: unknown; message?: unknown; url?: unknown };
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 80) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 180) : "";
  const candidate = typeof body.url === "string" ? body.url.trim() : "";
  const url = candidate.startsWith("/") && !candidate.startsWith("//") ? candidate.slice(0, 200) : "/app/discover";
  if (!title || !message) return NextResponse.json({ error: "Judul dan isi wajib." }, { status: 400 });

  const result = await pushToAll({ title, body: message, url, tag: "promo" });
  return NextResponse.json({ ok: true, ...result });
}

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

/** Terima selfie verifikasi. Foto masuk bucket privat; status profil jadi "pending". */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("selfie");
  if (!(file instanceof File)) return NextResponse.json({ error: "File selfie tidak ada." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File harus gambar." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Maksimal 8 MB." }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const admin = createAdminSupabase();

  const { error: upErr } = await admin.storage
    .from("verifications")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { error: updErr } = await admin.from("profiles").update({ is_verified: "pending" }).eq("id", user.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: "pending", path });
}

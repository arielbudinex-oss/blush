import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

/** Hapus akun milik sesi yang sedang aktif: auth user, profil (cascade), dan file fotonya. */
export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const admin = createAdminSupabase();

  // File foto tidak ikut terhapus lewat cascade, jadi dibersihkan dulu.
  const { data: files } = await admin.storage.from("photos").list(user.id, { limit: 100 });
  if (files?.length) {
    await admin.storage.from("photos").remove(files.map((f) => `${user.id}/${f.name}`));
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

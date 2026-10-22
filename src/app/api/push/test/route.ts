import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { pushToUsers } from "@/lib/push";

/** Kirim satu notifikasi uji ke perangkat milik user yang sedang masuk. */
export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const result = await pushToUsers([user.id], {
    title: "Notifikasi Blush aktif",
    body: "Kalau pesan ini muncul, like, match, dan pesan baru akan masuk ke perangkat ini.",
    url: "/app/settings",
    tag: "test-notif",
  });

  return NextResponse.json({ ok: true, ...result });
}

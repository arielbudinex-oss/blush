import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/** Status satu transaksi (dipakai halaman checkout untuk polling). RLS memastikan hanya milik sendiri. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const { data, error } = await supabase
    .from("payments")
    .select("id, status, amount_idr, paid_at, expires_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  return NextResponse.json(data);
}

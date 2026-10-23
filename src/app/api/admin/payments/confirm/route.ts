import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { activatePayment } from "@/lib/activate";
import type { Plan } from "@/lib/plans";

/** Admin menandai transaksi QRIS lunas setelah cek mutasi. Tidak ada jalur lain mengaktifkan premium. */
export async function POST(request: Request) {
  const supabase = await createServerSupabase("admin");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "Hanya admin." }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { paymentId?: string; action?: string };
  if (!body.paymentId) return NextResponse.json({ error: "paymentId wajib." }, { status: 400 });

  const admin = createAdminSupabase();
  const { data: payment, error } = await admin
    .from("payments")
    .select("id, profile_id, plan, months, status")
    .eq("id", body.paymentId)
    .maybeSingle();
  if (error || !payment) {
    return NextResponse.json({ error: error?.message ?? "Transaksi tidak ditemukan." }, { status: 404 });
  }

  if (body.action === "expire") {
    const { error: expErr } = await admin.from("payments").update({ status: "expired" }).eq("id", payment.id);
    if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: "expired" });
  }

  if (payment.status === "paid") return NextResponse.json({ ok: true, status: "paid" });

  const failure = await activatePayment(admin, { ...payment, plan: payment.plan as Plan }, "manual-admin");
  if (failure) return NextResponse.json({ error: failure }, { status: 500 });
  return NextResponse.json({ ok: true, status: "paid" });
}

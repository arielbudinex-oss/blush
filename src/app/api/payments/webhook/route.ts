import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { activatePayment } from "@/lib/activate";

/**
 * Hook pembayaran. Untuk sekarang dipakai sebagai jalur notifikasi manual/antara:
 * pemanggil harus mengirim header `x-blush-secret` yang sama dengan ADMIN_CONFIRM_SECRET.
 *
 * Kalau nanti pakai gateway (Midtrans/Xendit), ganti pemeriksaan secret di sini dengan
 * verifikasi signature resmi gateway tersebut, lalu panggil fungsi aktivasi yang sama.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-blush-secret");
  if (!process.env.ADMIN_CONFIRM_SECRET || secret !== process.env.ADMIN_CONFIRM_SECRET) {
    return NextResponse.json({ error: "Tidak berwenang." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { paymentId?: string; providerRef?: string };
  if (!body.paymentId) return NextResponse.json({ error: "paymentId wajib." }, { status: 400 });

  const admin = createAdminSupabase();
  const { data: payment, error } = await admin
    .from("payments")
    .select("id, profile_id, plan, months, status")
    .eq("id", body.paymentId)
    .maybeSingle();

  if (error || !payment) return NextResponse.json({ error: error?.message ?? "Transaksi tidak ditemukan." }, { status: 404 });
  if (payment.status === "paid") return NextResponse.json({ ok: true, note: "sudah lunas" });

  const failure = await activatePayment(admin, payment, body.providerRef);
  if (failure) return NextResponse.json({ error: failure }, { status: 500 });
  return NextResponse.json({ ok: true });
}

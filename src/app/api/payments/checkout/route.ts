import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { PLANS, type Plan } from "@/lib/plans";
import { toDynamicQris } from "@/lib/qris";

/** Buat transaksi QRIS dinamis untuk paket premium. Harga selalu dari PLANS (server), bukan dari klien. */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { plan?: string; months?: number };
  const plan = body.plan as Plan;
  const months = Number(body.months ?? 1);

  if (plan !== "plus" && plan !== "gold") {
    return NextResponse.json({ error: "Paket tidak dikenal." }, { status: 400 });
  }
  if (!Number.isInteger(months) || months < 1 || months > 12) {
    return NextResponse.json({ error: "Durasi harus 1–12 bulan." }, { status: 400 });
  }

  const amountIdr = PLANS[plan].priceIdr * months;
  const staticPayload = process.env.QRIS_STATIC_PAYLOAD?.trim();
  if (!staticPayload) {
    return NextResponse.json(
      {
        error:
          "QRIS merchant belum dikonfigurasi di server (QRIS_STATIC_PAYLOAD kosong). Isi payload QRIS statis milikmu dulu.",
      },
      { status: 409 },
    );
  }

  let payload: string;
  try {
    payload = toDynamicQris(staticPayload, amountIdr);
  } catch (e) {
    return NextResponse.json({ error: `QRIS tidak bisa dibuat: ${(e as Error).message}` }, { status: 500 });
  }

  const admin = createAdminSupabase();
  const { data: row, error } = await admin
    .from("payments")
    .insert({ profile_id: user.id, plan, months, amount_idr: amountIdr, method: "qris", qris_payload: payload })
    .select("id, expires_at, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const qrDataUrl = await QRCode.toDataURL(payload, { width: 512, margin: 1 });
  return NextResponse.json({
    paymentId: row.id,
    amountIdr,
    payload,
    qrDataUrl,
    status: row.status,
    expiresAt: row.expires_at,
  });
}

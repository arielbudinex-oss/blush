import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANS, type Plan } from "@/lib/plans";

type PaymentRow = { id: string; profile_id: string; plan: Plan; months: number };

/**
 * Tandai transaksi lunas dan perpanjang paket. Satu-satunya tempat premium dinyalakan —
 * selalu dipanggil dari route server dengan service-role client, tidak pernah dari klien.
 */
export async function activatePayment(
  admin: SupabaseClient,
  payment: PaymentRow,
  providerRef?: string,
): Promise<string | null> {
  const now = new Date();
  const { error: payErr } = await admin
    .from("payments")
    .update({ status: "paid", paid_at: now.toISOString(), provider_ref: providerRef ?? null })
    .eq("id", payment.id);
  if (payErr) return payErr.message;

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", payment.profile_id)
    .single();
  if (profErr) return profErr.message;

  const currentExpiry = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
  const base = currentExpiry && currentExpiry > now && profile?.plan !== "free" ? currentExpiry : now;
  const expires = new Date(base);
  expires.setMonth(expires.getMonth() + payment.months);

  const { error: updErr } = await admin
    .from("profiles")
    .update({ plan: PLANS[payment.plan].id, plan_expires_at: expires.toISOString() })
    .eq("id", payment.profile_id);
  if (updErr) return updErr.message;

  if (payment.plan === "gold") {
    await admin.from("boosts").insert({
      profile_id: payment.profile_id,
      expires_at: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
    });
  }
  return null;
}

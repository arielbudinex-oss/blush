import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { PLANS, formatIdr, type Plan } from "@/lib/plans";
import Checkout from "@/components/Checkout";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function PremiumPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/premium");

  const [{ data: profile }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("plan, plan_expires_at").eq("id", user.id).maybeSingle(),
    supabase
      .from("payments")
      .select("id, plan, months, amount_idr, status, created_at, expires_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const plan = (profile?.plan ?? "free") as Plan;

  return (
    <main className="mx-auto w-full max-w-3xl px-[var(--space-md)] py-[var(--space-lg)]">
      <h1 className="text-3xl">Paket Blush</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Paket aktif: <strong>{PLANS[plan].name}</strong>
        {profile?.plan_expires_at
          ? ` · berlaku sampai ${new Date(profile.plan_expires_at).toLocaleDateString("id-ID")}`
          : ""}
      </p>

      <div className="mt-[var(--space-lg)] grid gap-[var(--space-md)] md:grid-cols-2">
        {(["plus", "gold"] as const).map((id) => (
          <div key={id} className="flex flex-col gap-[var(--space-sm)]">
            <Checkout plan={id} planName={PLANS[id].name} priceIdr={PLANS[id].priceIdr} />
            <ul className="space-y-1 px-1 text-sm text-ink-soft">
              {PLANS[id].features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className="mt-[var(--space-xl)] rounded-card border border-line bg-paper-2 p-[var(--space-md)]">
        <h2 className="text-xl">Riwayat pembayaran</h2>
        {(payments ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Belum ada pembayaran.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {(payments ?? []).map(
              (p: { id: string; plan: string; months: number; amount_idr: number; status: string; created_at: string }) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-line bg-paper px-3 py-2">
                  <span>
                    {PLANS[p.plan as Plan]?.name ?? p.plan} · {p.months} bulan · {formatIdr(p.amount_idr)}
                  </span>
                  <span className="text-xs font-semibold text-ink-soft">
                    {p.status === "paid" ? "lunas" : p.status === "pending" ? "menunggu pembayaran" : p.status} ·{" "}
                    {new Date(p.created_at).toLocaleDateString("id-ID")}
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </main>
  );
}

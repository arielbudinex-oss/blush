import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/me";
import { PLANS, SUPERLIKE_PACKS, formatIdr, type Plan } from "@/lib/plans";
import Checkout from "@/components/Checkout";
import BoostButton from "@/components/BoostButton";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function PremiumPage() {
  const { supabase, user, profile } = await getMe();
  if (!user) redirect("/login?next=/app/premium");

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: payments }, { data: boosts }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, plan, months, amount_idr, status, created_at, expires_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("boosts")
      .select("started_at, expires_at")
      .eq("profile_id", user.id)
      .gte("started_at", monthStart.toISOString())
      .order("started_at", { ascending: false }),
  ]);

  const plan = (profile?.plan ?? "free") as Plan;

  return (
    <main className="mx-auto w-full max-w-3xl px-[var(--space-md)] py-[var(--space-lg)]">
      <h1 className="text-2xl font-bold sm:text-3xl">Paket Blush</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Paket aktif: <strong>{PLANS[plan].name}</strong>
        {profile?.plan_expires_at
          ? ` · berlaku sampai ${new Date(profile.plan_expires_at).toLocaleDateString("id-ID")}`
          : ""}
        . Bayar dengan QRIS, paket aktif setelah pembayaran dikonfirmasi.
      </p>
      <p className="mt-2 text-sm text-ink-soft">
        Harga lebih hemat dari langganan aplikasi kencan populer, dengan fitur yang tetap lengkap.
      </p>

      <div className="mt-[var(--space-lg)] grid gap-[var(--space-md)] md:grid-cols-2">
        {(["plus", "gold"] as const).map((id) => (
          <Checkout
            key={id}
            plan={id}
            planName={PLANS[id].name}
            priceIdr={PLANS[id].priceIdr}
            compareAtIdr={PLANS[id].compareAtIdr}
            features={PLANS[id].features}
            popular={id === "plus"}
          />
        ))}
      </div>

      {plan === "gold" ? (
        <section className="mt-[var(--space-lg)]">
          <BoostButton
            activeUntil={(boosts ?? []).find((b: { expires_at: string }) => new Date(b.expires_at) > new Date())?.expires_at ?? null}
            usedThisMonth={(boosts ?? []).length}
            quota={PLANS.gold.boostsPerMonth}
          />
        </section>
      ) : null}

      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Superlike tambahan</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Superlike harian tetap jalan. Paket ini menambah kuota untuk hari yang kamu butuh lebih banyak.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {SUPERLIKE_PACKS.map((pack) => (
            <div key={pack.id} className="rounded-[10px] border border-line bg-paper-2 px-3 py-3">
              <p className="text-sm font-semibold text-ink">{pack.count} superlike</p>
              <p className="mt-1 text-lg font-bold text-ink">{formatIdr(pack.priceIdr)}</p>
              <p className="mt-0.5 text-xs text-ink-soft">sekali beli</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Pembelian paket superlike dibantu admin lewat QRIS. Buka Pengaturan untuk menghubungi admin.
        </p>
      </section>

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

import { createServerSupabase } from "@/lib/supabase/server";
import { PLANS, formatIdr, type Plan } from "@/lib/plans";
import { PaymentRowActions } from "@/components/AdminActions";
import AdminPageHeader from "@/components/AdminPageHeader";

export const instant = false;
export const metadata = { title: "Pembayaran admin", robots: { index: false, follow: false } };

export default async function AdminPaymentsPage() {
  const supabase = await createServerSupabase();
  const { data: pending } = await supabase
    .from("payments")
    .select("id, profile_id, plan, months, amount_idr, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminPageHeader
        eyebrow="Operasional"
        title="Pembayaran"
        description="Konfirmasi hanya setelah dana QRIS benar-benar masuk. Setelah dikonfirmasi, paket aktif otomatis."
      >
        <span className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft">
          {pending?.length ?? 0} menunggu
        </span>
      </AdminPageHeader>

      <section className="mt-5 rounded-card border border-line bg-paper p-5">
        {(pending ?? []).length === 0 ? (
          <p className="rounded-[10px] bg-paper-2 px-3 py-6 text-center text-sm text-ink-soft">Tidak ada transaksi pending.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {(pending ?? []).map(
              (p: { id: string; plan: string; months: number; amount_idr: number; created_at: string }) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-line bg-paper-2 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {PLANS[p.plan as Plan]?.name ?? p.plan} · {p.months} bulan · {formatIdr(p.amount_idr)}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">{new Date(p.created_at).toLocaleString("id-ID")}</p>
                  </div>
                  <PaymentRowActions paymentId={p.id} />
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </>
  );
}

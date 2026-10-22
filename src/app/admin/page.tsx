import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { PLANS, formatIdr, type Plan } from "@/lib/plans";
import { PaymentRowActions, VerifyRowActions } from "@/components/AdminActions";
import AdminLive from "@/components/AdminLive";
import AdminPush from "@/components/AdminPush";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") {
    return (
      <main className="mx-auto w-full max-w-2xl px-[var(--space-md)] py-[var(--space-xl)]">
        <h1 className="text-3xl">Halaman admin</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Akunmu bukan admin. Untuk menjadikan admin, jalankan di SQL editor:
          <code className="mt-2 block break-all rounded-[8px] border border-line bg-paper-2 p-2 text-xs">
            update public.profiles set role = &apos;admin&apos; where id = &apos;{user.id}&apos;;
          </code>
        </p>
      </main>
    );
  }

  const [{ data: pending }, { data: verifiedPending }, { data: reports }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, profile_id, plan, months, amount_idr, status, created_at, qris_payload")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name, city").eq("is_verified", "pending"),
    supabase.from("reports").select("id, reporter_id, reported_id, reason, details, status").eq("status", "open"),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-[var(--space-md)] py-[var(--space-lg)]">
      <h1 className="text-3xl">Admin Blush</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Semua aksi di sini memakai service role di server dan hanya bisa dipanggil oleh akun ber-role admin.
      </p>

      <AdminLive />
      <AdminPush />

      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Pembayaran menunggu ({pending?.length ?? 0})</h2>
        {(pending ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Tidak ada transaksi pending.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {(pending ?? []).map(
              (p: { id: string; plan: string; months: number; amount_idr: number; created_at: string; profile_id: string }) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-line bg-paper-2 px-3 py-2 text-sm">
                  <span>
                    {PLANS[p.plan as Plan]?.name ?? p.plan} · {p.months} bln · <strong>{formatIdr(p.amount_idr)}</strong> ·{" "}
                    {new Date(p.created_at).toLocaleString("id-ID")}
                  </span>
                  <PaymentRowActions paymentId={p.id} />
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Verifikasi menunggu ({verifiedPending?.length ?? 0})</h2>
        {(verifiedPending ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Tidak ada selfie menunggu review.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {(verifiedPending ?? []).map((p: { id: string; display_name: string; city: string }) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-line bg-paper-2 px-3 py-2 text-sm">
                <span>
                  {p.display_name || "Tanpa nama"} · {p.city || "kota kosong"}
                </span>
                <VerifyRowActions userId={p.id} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-ink-faint">
          Selfie tersimpan di bucket privat <code>verifications/&lt;user_id&gt;/…</code> — buka lewat dashboard Supabase.
        </p>
      </section>

      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Laporan terbuka ({reports?.length ?? 0})</h2>
        {(reports ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Tidak ada laporan baru.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {(reports ?? []).map((r: { id: number; reason: string; details: string | null; reported_id: string }) => (
              <li key={r.id} className="rounded-[8px] border border-line bg-paper-2 px-3 py-2">
                <strong>{r.reason}</strong> · profil {r.reported_id.slice(0, 8)}…
                {r.details ? <span className="block text-xs text-ink-soft">{r.details}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

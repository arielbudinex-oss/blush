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
          Akun ini bukan admin. Hubungi pemilik Blush kalau kamu merasa seharusnya punya akses.
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

  const sections = [
    ["#aktivitas", "Aktivitas"],
    ["#notifikasi", "Notifikasi"],
    ["#pembayaran", "Pembayaran"],
    ["#verifikasi", "Verifikasi"],
    ["#laporan", "Laporan"],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-6xl px-[var(--space-md)] py-[var(--space-lg)]">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-blush-deep">Blush admin</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.02em]">Ringkasan hari ini</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Pengunjung, sesi, klik tautan, pembayaran, dan laporan dalam satu layar. Aksi sensitif memakai service role di server.
          </p>
        </div>
        <nav aria-label="Bagian admin" className="flex flex-wrap gap-1.5 text-xs font-semibold">
          {sections.map(([href, label]) => (
            <a key={href} href={href} className="inline-flex min-h-9 items-center rounded-full border border-line bg-paper px-3 text-ink-soft hover:border-line-strong hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <div id="aktivitas" className="scroll-mt-24">
        <AdminLive />
      </div>

      <div id="notifikasi" className="scroll-mt-24">
        <AdminPush />
      </div>

      <section id="pembayaran" className="mt-[var(--space-lg)] scroll-mt-24 rounded-card border border-line bg-paper p-[var(--space-md)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">Pembayaran menunggu</h2>
          <span className="rounded-full bg-paper-2 px-2 py-0.5 text-xs font-semibold text-ink-soft">{pending?.length ?? 0} transaksi</span>
        </div>
        {(pending ?? []).length === 0 ? (
          <p className="mt-3 rounded-[10px] bg-paper-2 px-3 py-4 text-sm text-ink-soft">Tidak ada transaksi pending.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {(pending ?? []).map(
              (p: { id: string; plan: string; months: number; amount_idr: number; created_at: string; profile_id: string }) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line bg-paper-2 px-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {PLANS[p.plan as Plan]?.name ?? p.plan} · {p.months} bulan · {formatIdr(p.amount_idr)}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">{new Date(p.created_at).toLocaleString("id-ID")}</p>
                  </div>
                  <PaymentRowActions paymentId={p.id} />
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      <section id="verifikasi" className="mt-[var(--space-lg)] scroll-mt-24 rounded-card border border-line bg-paper p-[var(--space-md)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">Verifikasi menunggu</h2>
          <span className="rounded-full bg-paper-2 px-2 py-0.5 text-xs font-semibold text-ink-soft">{verifiedPending?.length ?? 0} akun</span>
        </div>
        {(verifiedPending ?? []).length === 0 ? (
          <p className="mt-3 rounded-[10px] bg-paper-2 px-3 py-4 text-sm text-ink-soft">Tidak ada selfie menunggu review.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {(verifiedPending ?? []).map((p: { id: string; display_name: string; city: string }) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line bg-paper-2 px-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{p.display_name || "Tanpa nama"}</p>
                  <p className="text-xs text-ink-soft">{p.city || "Kota belum diisi"}</p>
                </div>
                <VerifyRowActions userId={p.id} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-faint">
          Selfie disimpan di bucket privat. Review tetap lewat halaman ini supaya aksesnya tercatat.
        </p>
      </section>

      <section id="laporan" className="mt-[var(--space-lg)] scroll-mt-24 rounded-card border border-line bg-paper p-[var(--space-md)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">Laporan terbuka</h2>
          <span className="rounded-full bg-paper-2 px-2 py-0.5 text-xs font-semibold text-ink-soft">{reports?.length ?? 0} laporan</span>
        </div>
        {(reports ?? []).length === 0 ? (
          <p className="mt-3 rounded-[10px] bg-paper-2 px-3 py-4 text-sm text-ink-soft">Tidak ada laporan baru.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {(reports ?? []).map((r: { id: number; reason: string; details: string | null; reported_id: string }) => (
              <li key={r.id} className="rounded-[10px] border border-line bg-paper-2 px-3 py-3">
                <p className="font-semibold text-ink">{r.reason}</p>
                <p className="text-xs text-ink-soft">Profil {r.reported_id.slice(0, 8)}…</p>
                {r.details ? <p className="mt-1 text-xs text-ink-soft">{r.details}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

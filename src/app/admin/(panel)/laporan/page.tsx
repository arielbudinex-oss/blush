import { createServerSupabase } from "@/lib/supabase/server";
import AdminPageHeader from "@/components/AdminPageHeader";

export const instant = false;
export const metadata = { title: "Laporan admin", robots: { index: false, follow: false } };

export default async function AdminReportsPage() {
  const supabase = await createServerSupabase();
  const { data: reports } = await supabase
    .from("reports")
    .select("id, reporter_id, reported_id, reason, details, status")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminPageHeader
        eyebrow="Operasional"
        title="Laporan"
        description="Laporan pengguna yang masih terbuka. Tinjau bukti sebelum mengambil tindakan."
      >
        <span className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft">
          {reports?.length ?? 0} terbuka
        </span>
      </AdminPageHeader>

      <section className="mt-5 rounded-card border border-line bg-paper p-5">
        {(reports ?? []).length === 0 ? (
          <p className="rounded-[10px] bg-paper-2 px-3 py-6 text-center text-sm text-ink-soft">Tidak ada laporan baru.</p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {(reports ?? []).map((r: { id: number; reason: string; details: string | null; reported_id: string }) => (
              <li key={r.id} className="rounded-[10px] border border-line bg-paper-2 px-4 py-3">
                <p className="font-semibold text-ink">{r.reason}</p>
                <p className="mt-1 text-xs text-ink-soft">Profil {r.reported_id.slice(0, 8)}…</p>
                {r.details ? <p className="mt-2 text-sm leading-6 text-ink-soft">{r.details}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

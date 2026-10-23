import { createServerSupabase } from "@/lib/supabase/server";
import { VerifyRowActions } from "@/components/AdminActions";
import AdminPageHeader from "@/components/AdminPageHeader";

export const instant = false;
export const metadata = { title: "Verifikasi admin", robots: { index: false, follow: false } };

export default async function AdminVerificationPage() {
  const supabase = await createServerSupabase();
  const { data: pending } = await supabase
    .from("profiles")
    .select("id, display_name, city")
    .eq("is_verified", "pending")
    .order("last_active_at", { ascending: false });

  return (
    <>
      <AdminPageHeader
        eyebrow="Operasional"
        title="Verifikasi"
        description="Tinjau akun yang menunggu verifikasi. Selfie disimpan di bucket privat dan hanya diakses dari halaman ini."
      >
        <span className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft">
          {pending?.length ?? 0} menunggu
        </span>
      </AdminPageHeader>

      <section className="mt-5 rounded-card border border-line bg-paper p-5">
        {(pending ?? []).length === 0 ? (
          <p className="rounded-[10px] bg-paper-2 px-3 py-6 text-center text-sm text-ink-soft">Tidak ada selfie menunggu review.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {(pending ?? []).map((p: { id: string; display_name: string; city: string }) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-line bg-paper-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{p.display_name || "Tanpa nama"}</p>
                  <p className="mt-1 text-xs text-ink-soft">{p.city || "Kota belum diisi"}</p>
                </div>
                <VerifyRowActions userId={p.id} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs leading-5 text-ink-soft">Setelah disetujui, badge centang biru muncul di profil dan kartu deck.</p>
      </section>
    </>
  );
}

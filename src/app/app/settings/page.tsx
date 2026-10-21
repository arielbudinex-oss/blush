import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import UnblockButton from "@/components/UnblockButton";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/settings");

  const [{ data: blocks }, { data: reports }] = await Promise.all([
    supabase.from("blocks").select("blocked_id, created_at").eq("blocker_id", user.id).order("created_at", { ascending: false }),
    supabase.from("reports").select("id, reason, status, created_at, reported_id").eq("reporter_id", user.id).order("created_at", { ascending: false }),
  ]);

  const blockedIds = (blocks ?? []).map((b: { blocked_id: string }) => b.blocked_id);
  const { data: blockedProfiles } = blockedIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", blockedIds)
    : { data: [] as { id: string; display_name: string }[] };

  const nameOf = (id: string) => blockedProfiles?.find((p) => p.id === id)?.display_name || "Pengguna";

  return (
    <main className="mx-auto w-full max-w-2xl px-[var(--space-md)] py-[var(--space-lg)]">
      <h1 className="text-3xl">Keamanan &amp; privasi</h1>

      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Daftar blokir</h2>
        {blockedIds.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Belum ada yang kamu blokir.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {blockedIds.map((id) => (
              <li key={id} className="flex items-center justify-between gap-2 rounded-[8px] border border-line bg-paper-2 px-3 py-2">
                <span className="truncate text-sm">{nameOf(id)}</span>
                <UnblockButton blockerId={user.id} blockedId={id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Laporan kamu</h2>
        {(reports ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Belum ada laporan yang kamu kirim.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {(reports ?? []).map((r: { id: number; reason: string; status: string; reported_id: string }) => (
              <li key={r.id} className="rounded-[8px] border border-line bg-paper-2 px-3 py-2">
                <span className="font-medium">{r.reason}</span> · {nameOf(r.reported_id)} · status{" "}
                <strong>{r.status === "open" ? "menunggu review" : r.status}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper-2 p-[var(--space-md)]">
        <h2 className="text-xl">Data &amp; lokasi</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Lokasi presisi dipakai hanya untuk menghitung jarak di server. Orang lain hanya melihat perkiraan jarak
          (misalnya &ldquo;3 km dari kamu&rdquo;), bukan koordinatmu. Foto verifikasi disimpan di bucket privat dan
          tidak pernah tampil di profil.
        </p>
      </section>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Icon, type IconName } from "@/components/Icon";
import UnblockButton from "@/components/UnblockButton";
import SignOutButton from "@/components/SignOutButton";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import PushNotifications from "@/components/PushNotifications";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

const LINKS: { href: string; label: string; hint: string; icon: IconName }[] = [
  { href: "/app/profile", label: "Profil dan preferensi", hint: "Foto, bio, minat, jarak", icon: "user" },
  { href: "/app/verify", label: "Verifikasi wajah", hint: "Dapat centang biru, opsional", icon: "shield" },
  { href: "/app/premium", label: "Paket dan pembayaran", hint: "Blush Plus, Gold, riwayat QRIS", icon: "star" },
];

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
      <h1 className="text-3xl font-bold">Keamanan dan privasi</h1>
      <p className="mt-1 text-sm text-ink-soft">Atur profil, blokir, dan lokasi dari satu tempat.</p>

      <section className="mt-[var(--space-lg)] overflow-hidden rounded-card border border-line bg-paper">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex min-h-16 items-center gap-3 border-b border-line px-4 py-3 transition-colors duration-150 last:border-b-0 hover:bg-paper-2"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[999px] bg-paper-2 text-ink">
              <Icon name={l.icon} className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{l.label}</span>
              <span className="block truncate text-xs text-ink-soft">{l.hint}</span>
            </span>
            <Icon name="chevron" className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2.2} />
          </Link>
        ))}
      </section>

      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Daftar blokir</h2>
        {blockedIds.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Belum ada orang yang kamu blokir.</p>
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
        <h2 className="text-xl">Laporan yang kamu kirim</h2>
        {(reports ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Belum ada laporan.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {(reports ?? []).map((r: { id: number; reason: string; status: string; reported_id: string }) => (
              <li key={r.id} className="rounded-[8px] border border-line bg-paper-2 px-3 py-2">
                <span className="font-medium">{r.reason}</span> · {nameOf(r.reported_id)} ·{" "}
                <strong>{r.status === "open" ? "menunggu ditinjau" : r.status}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PushNotifications />

      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Data dan lokasi</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Lokasi hanya dipakai untuk menghitung jarak. Orang lain melihat perkiraan seperti &ldquo;3 km dari kamu&rdquo;,
          bukan titik koordinat. Foto verifikasi wajah disimpan di penyimpanan privat dan tidak pernah muncul di profil.
        </p>
      </section>

      <section className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Akun</h2>
        <p className="mt-1 text-sm text-ink-soft">Keluar dari perangkat ini, atau hapus akun beserta seluruh datanya.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <SignOutButton />
          <DeleteAccountButton />
        </div>
      </section>
    </main>
  );
}

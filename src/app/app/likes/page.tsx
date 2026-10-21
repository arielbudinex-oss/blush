import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { PLANS, isPremium, type Plan } from "@/lib/plans";
import { photoUrl } from "@/lib/photo";
import { btnPrimary } from "@/components/ui";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function LikesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user!.id).maybeSingle();
  const plan = (profile?.plan ?? "free") as Plan;

  if (!isPremium(plan)) {
    return (
      <main className="mx-auto w-full max-w-2xl px-[var(--space-md)] py-[var(--space-xl)]">
        <h1 className="text-3xl">Siapa yang nge-like kamu</h1>
        <p className="mt-2 text-ink-soft">
          Fitur ini bagian dari Blush Plus dan Gold: kamu bisa melihat semua orang yang sudah menekan Suka sebelum
          kamu membalas. Di paket gratis, mereka tetap masuk daftar — daftarnya yang tersembunyi.
        </p>
        <div className="mt-[var(--space-lg)] rounded-card border border-line bg-paper p-[var(--space-md)]">
          <h2 className="text-xl">{PLANS.plus.name}</h2>
          <p className="mt-1 text-sm text-ink-soft">{PLANS.plus.tagline}</p>
          <ul className="mt-3 space-y-1 text-sm text-ink-soft">
            {PLANS.plus.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <Link href="/app/premium" className={`${btnPrimary} mt-4`}>
            Lihat paket & bayar QRIS
          </Link>
        </div>
      </main>
    );
  }

  const { data: likes } = await supabase.rpc("likes_received");

  return (
    <main className="mx-auto w-full max-w-3xl px-[var(--space-md)] py-[var(--space-lg)]">
      <h1 className="text-3xl">Siapa yang nge-like kamu</h1>
      <p className="mt-1 text-sm text-ink-soft">Mereka menekan Suka lebih dulu. Balas dengan Suka dari deck untuk match.</p>
      <div className="mt-[var(--space-lg)] grid gap-[var(--space-sm)] sm:grid-cols-2">
        {(likes ?? []).length === 0 ? (
          <p className="text-sm text-ink-soft">Belum ada yang nge-like. Perluas jangkauanmu di preferensi.</p>
        ) : null}
        {(likes ?? []).map((l: { id: string; display_name: string; age: number | null; photos: string[]; action: string }) => {
          const url = photoUrl(l.photos?.[0]);
          return (
            <article key={l.id} className="flex items-center gap-[var(--space-sm)] rounded-card border border-line bg-paper p-[var(--space-sm)]">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[8px] bg-blush-tint">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={`Foto ${l.display_name}`} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {l.display_name || "Tanpa nama"} {l.age ? <span className="text-ink-faint">· {l.age}</span> : null}
                </p>
                <p className="text-xs text-ink-faint">{l.action === "superlike" ? "Superlike" : "Like"}</p>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

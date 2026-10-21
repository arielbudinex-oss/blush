import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { isPremium, type Plan } from "@/lib/plans";
import { photoUrl } from "@/lib/photo";
import { btnPrimary } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

type Like = {
  id: string;
  display_name: string;
  age: number | null;
  photos: string[];
  action: "like" | "superlike";
  created_at: string;
  is_verified: "none" | "pending" | "approved" | "rejected";
};

export default async function LikesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user!.id).maybeSingle();
  const plan = (profile?.plan ?? "free") as Plan;

  if (!isPremium(plan)) {
    return (
      <main className="mx-auto w-full max-w-2xl px-[var(--space-md)] py-[var(--space-lg)]">
        <h1 className="text-3xl">Yang suka kamu</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Mereka sudah suka duluan. Di paket gratis, fotonya masih disamarkan.
        </p>
        <div aria-hidden="true" className="relative mt-4 overflow-hidden rounded-[12px] border border-line bg-paper-2">
          <div className="grid grid-cols-3 gap-px bg-line">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="relative aspect-[3/4] overflow-hidden bg-paper">
                <span
                  className={`absolute inset-0 ${
                    [
                      "bg-gradient-to-br from-blush-tint via-paper-3 to-paper-2",
                      "bg-gradient-to-tr from-sky/35 via-paper-3 to-blush-tint",
                      "bg-gradient-to-b from-paper-3 via-blush-tint to-paper-2",
                      "bg-gradient-to-bl from-paper-3 via-paper-2 to-blush/25",
                      "bg-gradient-to-t from-blush-tint via-paper-2 to-paper-3",
                      "bg-gradient-to-r from-paper-2 via-blush-tint to-sky/25",
                    ][i]
                  }`}
                />
                <span className="absolute bottom-0 left-1/2 h-1/2 w-2/3 -translate-x-1/2 rounded-t-full bg-ink/15 blur-[3px]" />
                <span className="absolute inset-0 backdrop-blur-[7px]" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 grid place-items-center">
            <span className="inline-flex items-center gap-1.5 rounded-[999px] bg-ink/85 px-3 py-1.5 text-xs font-semibold text-paper">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2]">
                <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
                <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" />
              </svg>
              Khusus Plus
            </span>
          </div>
        </div>
        <div className="mt-4 rounded-card border border-line bg-paper p-[var(--space-md)]">
          <h2 className="text-xl">Buka yang suka kamu</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Plus nampilin semua like yang masuk, plus swipe tanpa batas.
          </p>
          <Link href="/app/premium" className={`${btnPrimary} mt-4`}>
            Lihat Blush Plus
          </Link>
        </div>
      </main>
    );
  }

  const { data: likes } = await supabase.rpc("likes_received");
  const rows = (likes ?? []) as Like[];

  return (
    <main className="mx-auto w-full max-w-3xl px-[var(--space-md)] py-[var(--space-lg)]">
      <h1 className="text-3xl">Yang suka kamu</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {rows.length > 0 ? `${rows.length} orang sudah suka duluan.` : "Belum ada yang suka."} Balas dari deck, kalau
        cocok kalian langsung match.
      </p>

      {rows.length === 0 ? (
        <div className="mt-[var(--space-lg)] rounded-card border border-dashed border-line-strong bg-paper-2 p-[var(--space-md)]">
          <p className="text-sm text-ink-soft">Perluas jarak atau umur di preferensi supaya lebih banyak orang melihat profilmu.</p>
          <Link href="/app/profile" className={`${btnPrimary} mt-3`}>
            Ubah preferensi
          </Link>
        </div>
      ) : (
        <Stagger className="mt-[var(--space-lg)] grid gap-[var(--space-sm)] sm:grid-cols-2">
          {rows.map((l) => {
            const url = photoUrl(l.photos?.[0]);
            return (
              <StaggerItem key={l.id}>
                <article className="flex items-center gap-[var(--space-sm)] rounded-card border border-line bg-paper p-[var(--space-sm)]">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-blush-tint">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={`Foto ${l.display_name}`} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1 font-semibold">
                      <span className="truncate">{l.display_name || "Tanpa nama"}</span>
                      {l.age ? <span className="text-ink-faint">· {l.age}</span> : null}
                      {l.is_verified === "approved" ? (
                        <span
                          title="Terverifikasi"
                          className="inline-grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-verify text-white"
                        >
                          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[2.8]">
                            <path d="M3.2 8.6l3 3 6.6-7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="sr-only">Terverifikasi</span>
                        </span>
                      ) : null}
                    </p>
                    <p className={`text-xs font-semibold ${l.action === "superlike" ? "text-blush-deep" : "text-ink-faint"}`}>
                      {l.action === "superlike" ? "Superlike" : "Like"}
                    </p>
                  </div>
                  <Link
                    href="/app/discover"
                    className="shrink-0 rounded-[999px] border border-blush-deep px-3 py-1.5 text-xs font-semibold text-blush-deep"
                  >
                    Balas
                  </Link>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </main>
  );
}

import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { isPremium, type Plan } from "@/lib/plans";
import { photoUrl } from "@/lib/photo";
import { Icon } from "@/components/Icon";
import { btnPrimary } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import LikeBackButton from "@/components/LikeBackButton";

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

  // RPC ini mengembalikan like yang masuk; tampilan gratis hanya memakai fotonya yang disamarkan.
  const { data: likes } = await supabase.rpc("likes_received");
  const rows = (likes ?? []) as Like[];

  if (!isPremium(plan)) {
    const preview = rows.slice(0, 6);
    return (
      <main className="mx-auto w-full max-w-2xl px-[var(--space-md)] py-[var(--space-lg)]">
        <h1 className="text-3xl font-bold">Yang suka kamu</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {rows.length > 0
            ? `${rows.length} orang sudah suka duluan. Di paket gratis, fotonya masih disamarkan.`
            : "Belum ada yang suka. Lengkapi profil supaya lebih mudah ditemukan."}
        </p>
        {preview.length > 0 ? (
          <div aria-hidden="true" className="relative mt-4 overflow-hidden rounded-[12px] border border-line bg-paper-2">
            <div className="grid grid-cols-3 gap-px bg-line">
              {preview.map((l) => {
                const src = photoUrl(l.photos?.[0]);
                return (
                  <div key={l.id} className="relative aspect-[3/4] overflow-hidden bg-paper-2">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="h-full w-full scale-125 object-cover blur-[18px]" />
                    ) : (
                      <span className="absolute inset-0 bg-gradient-to-b from-paper-3 to-paper-2" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="absolute inset-0 grid place-items-center bg-paper/10">
              <span className="inline-flex items-center gap-1.5 rounded-[999px] bg-ink/85 px-3 py-1.5 text-xs font-semibold text-paper">
                <Icon name="lock" className="h-3.5 w-3.5" />
                Khusus Plus
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-[var(--space-lg)] rounded-card border border-dashed border-line-strong bg-paper-2 px-5 py-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-3 text-ink-soft">
              <Icon name="heart" className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="mx-auto mt-3 max-w-[30ch] text-sm text-ink-soft">
              Perluas jarak atau umur di preferensi supaya lebih banyak orang melihat profilmu.
            </p>
            <Link href="/app/profile" className={`${btnPrimary} mt-4`}>
              Ubah preferensi
            </Link>
          </div>
        )}

        {preview.length > 0 ? (
          <div className="mt-4 rounded-card border border-line bg-paper p-[var(--space-md)]">
            <h2 className="text-xl">Blush Plus</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Semua like yang masuk terlihat. Swipe tanpa batas, dan geseran terakhir bisa dibatalkan.
            </p>
            <Link href="/app/premium" className={`${btnPrimary} mt-4 w-full`}>
              Buka Blush Plus
            </Link>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-[var(--space-md)] py-[var(--space-lg)]">
      <h1 className="text-3xl font-bold">Yang suka kamu</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {rows.length > 0
          ? `${rows.length} orang sudah suka duluan. Balas dari halaman Temukan, kalau cocok kalian langsung match.`
          : "Kalau ada yang suka, fotonya muncul di sini."}
      </p>

      {rows.length === 0 ? (
        <div className="mt-[var(--space-lg)] rounded-card border border-dashed border-line-strong bg-paper-2 px-5 py-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-3 text-ink-soft">
            <Icon name="heart" className="h-5 w-5" strokeWidth={2} />
          </span>
          <p className="mx-auto mt-3 max-w-[30ch] text-sm text-ink-soft">
            Perluas jarak atau umur di preferensi supaya lebih banyak orang melihat profilmu.
          </p>
          <Link href="/app/profile" className={`${btnPrimary} mt-4`}>
            Ubah preferensi
          </Link>
        </div>
      ) : (
        <Stagger className="mt-[var(--space-lg)] grid gap-[var(--space-sm)] sm:grid-cols-2">
          {rows.map((l) => {
            const url = photoUrl(l.photos?.[0]);
            return (
              <StaggerItem key={l.id}>
                <article className="flex h-full items-center gap-[var(--space-sm)] rounded-card border border-line bg-paper p-[var(--space-sm)]">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-paper-2">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={`Foto ${l.display_name}`} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 items-center gap-1 font-semibold">
                      <span className="min-w-0 truncate">{l.display_name || "Tanpa nama"}</span>
                      {l.age ? <span className="shrink-0 text-ink-faint">· {l.age}</span> : null}
                      {l.is_verified === "approved" ? (
                        <span
                          title="Terverifikasi"
                          className="inline-grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-verify text-white"
                        >
                          <Icon name="check" className="h-3 w-3" strokeWidth={2.8} />
                          <span className="sr-only">Terverifikasi</span>
                        </span>
                      ) : null}
                    </p>
                    <p className={`text-xs font-semibold ${l.action === "superlike" ? "text-blush-deep" : "text-ink-faint"}`}>
                      {l.action === "superlike" ? "Superlike" : "Menyukai profilmu"}
                    </p>
                  </div>
                  <LikeBackButton targetId={l.id} />
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </main>
  );
}

import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { photoUrl } from "@/lib/photo";
import { Stagger, StaggerItem } from "@/components/motion";
import ExpiryChip from "@/components/ExpiryChip";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

type Row = {
  match_id: string;
  other_id: string;
  display_name: string;
  photos: string[];
  created_at: string;
  last_message: string | null;
  last_message_at: string | null;
  unread: number;
  expires_at: string | null;
  is_verified: "none" | "pending" | "approved" | "rejected";
};

export default async function MatchesPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc("my_matches");
  const rows = (data ?? []) as Row[];

  return (
    <main className="mx-auto w-full max-w-2xl px-[var(--space-md)] py-[var(--space-lg)]">
      <h1 className="text-3xl">Match kamu</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Chat kebuka otomatis setelah kalian saling suka. Kalau 24 jam nggak ada pesan, match-nya hilang.
      </p>

      {rows.length === 0 ? (
        <div className="mt-[var(--space-lg)] grid place-items-center rounded-card border border-line bg-paper-2 px-5 py-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-[999px] bg-blush-tint text-blush-deep">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1.2-4.2A8 8 0 1121 12z" />
            </svg>
          </span>
          <p className="mt-3 text-base font-semibold text-ink">Belum ada chat</p>
          <p className="mt-1 max-w-[32ch] text-sm text-ink-soft">
            Kalau kalian saling suka, room chat langsung kebuka di sini.
          </p>
          <Link href="/app/discover" className="mt-4 inline-flex min-h-11 items-center rounded-[999px] bg-blush-deep px-5 text-sm font-bold text-paper app-press hover:bg-ink">
            Mulai swipe
          </Link>
        </div>
      ) : null}

      <Stagger className="mt-[var(--space-lg)] flex flex-col gap-2">
        {rows.map((m) => {
          const url = photoUrl(m.photos?.[0]);
          return (
            <StaggerItem key={m.match_id}>
              <Link
                href={`/app/chat/${m.match_id}`}
                className="flex items-center gap-[var(--space-sm)] rounded-card border border-line bg-paper p-[var(--space-sm)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-blush-tint">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`Foto ${m.display_name}`} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="flex items-center gap-1">
                    <span className="truncate font-semibold">{m.display_name || "Tanpa nama"}</span>
                    {m.is_verified === "approved" ? (
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
                  </span>
                  <p className="truncate text-sm text-ink-soft">
                    {m.last_message ?? "Belum ada pesan — sapa duluan, lebih cepat."}
                  </p>
                </div>
                {m.unread > 0 ? (
                  <span className="shrink-0 rounded-[999px] bg-blush-deep px-2 py-0.5 text-2xs font-semibold text-paper">
                    {m.unread} baru
                  </span>
                ) : (
                  <ExpiryChip expiresAt={m.expires_at} />
                )}
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </main>
  );
}

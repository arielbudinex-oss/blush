import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { photoUrl } from "@/lib/photo";
import { Stagger, StaggerItem } from "@/components/motion";
import ExpiryChip from "@/components/ExpiryChip";
import { Icon } from "@/components/Icon";
import { formatStamp } from "@/lib/time";

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
      <h1 className="text-3xl font-bold">Chat</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Kalau kalian saling suka, room-nya langsung kebuka di sini. Tanpa pesan dalam 24 jam, match-nya hilang.
      </p>

      {rows.length === 0 ? (
        <div className="mt-[var(--space-lg)] grid place-items-center rounded-card border border-line bg-paper-2 px-5 py-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-blush-tint text-blush-deep">
            <Icon name="chat" className="h-7 w-7" />
          </span>
          <p className="mt-3 text-base font-semibold text-ink">Belum ada chat</p>
          <p className="mt-1 max-w-[32ch] text-sm text-ink-soft">
            Kalau kalian saling suka, room chat langsung kebuka di sini.
          </p>
          <Link href="/app/discover" className="app-press mt-4 inline-flex min-h-11 items-center rounded-full bg-blush-deep px-5 text-sm font-bold text-paper hover:bg-ink">
            Mulai geser
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
                className="flex items-center gap-[var(--space-sm)] rounded-card border border-line bg-paper p-[var(--space-sm)] transition-colors duration-150 hover:border-line-strong hover:bg-paper-2"
              >
                <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full bg-blush-tint">
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
                        <Icon name="check" className="h-3 w-3" />
                        <span className="sr-only">Terverifikasi</span>
                      </span>
                    ) : null}
                  </span>
                  <p className="truncate text-sm text-ink-soft">
                    {m.last_message ?? "Belum ada pesan. Sapa duluan."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {m.last_message_at ? (
                    <span className="text-2xs font-medium text-ink-faint">{formatStamp(m.last_message_at)}</span>
                  ) : null}
                  {m.unread > 0 ? (
                    <span className="min-w-5 rounded-full bg-blush-deep px-1.5 py-0.5 text-center text-2xs font-semibold text-paper">
                      {m.unread}
                    </span>
                  ) : (
                    <ExpiryChip expiresAt={m.expires_at} />
                  )}
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </main>
  );
}

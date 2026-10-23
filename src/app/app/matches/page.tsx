import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { photoUrl } from "@/lib/photo";
import { Stagger, StaggerItem } from "@/components/motion";
import ExpiryChip from "@/components/ExpiryChip";
import { Icon } from "@/components/Icon";
import VerifiedBadge from "@/components/VerifiedBadge";
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
  const fresh = rows.filter((r) => !r.last_message);
  const threads = rows.filter((r) => Boolean(r.last_message));

  return (
    <main className="mx-auto w-full max-w-2xl px-[var(--space-md)] py-[var(--space-lg)]">
      <h1 className="text-3xl font-bold">Chat</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Saling suka membuka chat. Balas dalam 24 jam, atau perpanjang sekali dari dalam room.
      </p>

      {rows.length === 0 ? (
        <div className="mt-[var(--space-lg)] grid place-items-center rounded-card border border-line bg-paper-2 px-5 py-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-paper-3 text-ink-soft">
            <Icon name="chat" className="h-7 w-7" />
          </span>
          <p className="mt-3 text-base font-semibold text-ink">Belum ada chat</p>
          <p className="mt-1 max-w-[32ch] text-sm text-ink-soft">
            Geser beberapa profil dulu. Match pertamamu muncul di sini.
          </p>
          <Link href="/app/discover" className="app-press mt-4 inline-flex min-h-11 items-center rounded-full bg-blush-deep px-5 text-sm font-bold text-paper hover:bg-ink">
            Mulai geser
          </Link>
        </div>
      ) : null}

      {fresh.length ? (
        <section className="mt-[var(--space-lg)]">
          <h2 className="text-sm font-bold text-ink">Match baru</h2>
          <p className="mt-0.5 text-xs text-ink-soft">Belum ada pesan. Sapa duluan sebelum waktunya habis.</p>
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
            {fresh.map((m) => {
              const url = photoUrl(m.photos?.[0]);
              return (
                <Link key={m.match_id} href={`/app/chat/${m.match_id}`} className="flex w-24 shrink-0 flex-col items-center gap-1.5 text-center">
                  <span className="relative block h-20 w-20 overflow-hidden rounded-full border-2 border-blush-deep bg-paper-2">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={`Foto ${m.display_name}`} className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="w-full truncate text-xs font-semibold">{m.display_name || "Tanpa nama"}</span>
                  <ExpiryChip
                    expiresAt={
                      m.expires_at ??
                      new Date(new Date(m.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
                    }
                  />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {rows.length ? (
        <h2 className="mt-[var(--space-lg)] text-sm font-bold text-ink">Percakapan</h2>
      ) : null}
      {rows.length && !threads.length ? (
        <p className="mt-1 text-xs text-ink-soft">Belum ada percakapan. Sapa salah satu match barumu.</p>
      ) : null}

      <Stagger className="mt-2 flex flex-col gap-2">
        {threads.map((m) => {
          const url = photoUrl(m.photos?.[0]);
          return (
            <StaggerItem key={m.match_id}>
              <Link
                href={`/app/chat/${m.match_id}`}
                className="flex items-center gap-[var(--space-sm)] rounded-card border border-line bg-paper p-[var(--space-sm)] transition-colors duration-150 hover:border-line-strong hover:bg-paper-2"
              >
                <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full bg-paper-2">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`Foto ${m.display_name}`} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="flex items-center gap-1">
                    <span className="truncate font-semibold">{m.display_name || "Tanpa nama"}</span>
                    {m.is_verified === "approved" ? (
                      <VerifiedBadge />
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
                    <span className="min-w-4 rounded-full bg-blush-deep px-1 py-0 text-center text-[10px] font-semibold leading-4 text-paper">
                      {m.unread}
                    </span>
                  ) : (
                    <ExpiryChip
                      expiresAt={
                        m.expires_at ??
                        new Date(new Date(m.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
                      }
                    />
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

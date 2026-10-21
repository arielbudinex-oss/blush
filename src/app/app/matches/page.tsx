import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { photoUrl } from "@/lib/photo";

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
};

export default async function MatchesPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc("my_matches");
  const rows = (data ?? []) as Row[];

  return (
    <main className="mx-auto w-full max-w-2xl px-[var(--space-md)] py-[var(--space-lg)]">
      <h1 className="text-3xl">Match kamu</h1>
      <p className="mt-1 text-sm text-ink-soft">Room chat terbuka otomatis begitu kalian saling suka.</p>

      {(data ?? []).length === 0 ? (
        <div className="mt-[var(--space-lg)] rounded-card border border-line bg-paper-2 p-[var(--space-md)]">
          <p className="text-sm text-ink-soft">Belum ada match. Mulai dari deck Discover.</p>
          <Link href="/app/discover" className="mt-3 inline-block text-sm font-semibold text-blush-deep">
            Buka Discover
          </Link>
        </div>
      ) : null}

      <ul className="mt-[var(--space-lg)] flex flex-col gap-2">
        {rows.map((m) => {
          const url = photoUrl(m.photos?.[0]);
          return (
            <li key={m.match_id}>
              <Link
                href={`/app/chat/${m.match_id}`}
                className="flex items-center gap-[var(--space-sm)] rounded-card border border-line bg-paper p-[var(--space-sm)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[8px] bg-blush-tint">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`Foto ${m.display_name}`} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.display_name || "Tanpa nama"}</p>
                  <p className="truncate text-sm text-ink-soft">
                    {m.last_message ?? "Belum ada pesan — sapa duluan, lebih cepat."}
                  </p>
                </div>
                {m.unread > 0 ? (
                  <span className="rounded-[999px] bg-blush-deep px-2 py-0.5 text-2xs font-semibold text-paper">
                    {m.unread} baru
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

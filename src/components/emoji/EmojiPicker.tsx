"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { AppleEmoji, EmojiSprite } from "@/components/emoji/EmojiText";

type Item = { u: string; x: number; y: number; n: string; a: string; c: number; k: string; s: number };
type Data = { categories: string[]; emoji: Item[] };

const RECENT_KEY = "blush:emoji-recent";
const MAX_RECENT = 16;

function readRecent(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((x) => typeof x === "string").slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

/** Simpan unified id sebelum induk sempat menutup picker, supaya riwayat tidak hilang. */
function saveRecent(unified: string) {
  const next = [unified, ...readRecent().filter((x) => x !== unified)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage can be full or disabled */
  }
  return next;
}

const TABS: { icon: string; label: string }[] = [
  { icon: "😀", label: "Wajah" },
  { icon: "👋", label: "Orang" },
  { icon: "🐻", label: "Hewan dan alam" },
  { icon: "🍔", label: "Makanan" },
  { icon: "✈️", label: "Jalan-jalan" },
  { icon: "⚽", label: "Aktivitas" },
  { icon: "💡", label: "Benda" },
  { icon: "❤️", label: "Simbol" },
  { icon: "🏳️", label: "Bendera" },
];

export function emojiFromUnified(unified: string) {
  return unified
    .split("-")
    .map((part) => String.fromCodePoint(parseInt(part, 16)))
    .join("");
}

export default function EmojiPicker({ onPick }: { onPick: (native: string) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<number | "recent">(0);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    import("@/lib/emoji/apple-emoji-data.json").then((mod) => {
      if (alive) setData(mod.default as Data);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  function pick(item: Item) {
    setRecent(saveRecent(item.u));
    onPick(emojiFromUnified(item.u));
  }

  const items = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (q) {
      return data.emoji
        .filter((e) => e.a.toLowerCase().includes(q) || e.k.toLowerCase().includes(q) || e.n.includes(q))
        .slice(0, 160);
    }
    if (tab === "recent") {
      // Simpan unified id; entri lama berupa glyph native tetap dikenali.
      return recent
        .map((entry) => data.emoji.find((e) => e.u === entry) ?? data.emoji.find((e) => emojiFromUnified(e.u) === entry))
        .filter((e): e is Item => Boolean(e));
    }
    return data.emoji.filter((e) => e.c === tab);
  }, [data, query, tab, recent]);

  // Isi sisa ruang tab Terakhir supaya panel tidak terlihat kosong saat riwayat masih sedikit.
  const popular = useMemo(() => {
    if (!data || tab !== "recent" || query) return [];
    const have = new Set(items.map((e) => e.u));
    return data.emoji.filter((e) => e.c === 0 && !have.has(e.u)).slice(0, 24);
  }, [data, tab, query, items]);

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <div className="border-b border-line px-2.5 py-2">
        <div className="flex h-9 items-center gap-2 rounded-full bg-paper-2 pl-3 pr-2 ring-1 ring-transparent focus-within:ring-ink/25">
          <Icon name="search" className="h-4 w-4 shrink-0 text-ink-soft" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari emoji"
            aria-label="Cari emoji"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-1.5 pb-4 pt-2 [mask-image:linear-gradient(to_bottom,#000_calc(100%-20px),transparent)]">
        {!data ? (
          <p className="grid h-full place-items-center text-sm text-ink-soft">Memuat emoji…</p>
        ) : items.length === 0 ? (
          <p className="grid h-full place-items-center px-4 text-center text-sm text-ink-soft">
            {query ? "Emoji itu belum ada. Coba kata lain." : "Belum ada emoji yang sering dipakai."}
          </p>
        ) : (
          <>
            {tab === "recent" && !query ? <p className="px-1 pb-1.5 text-2xs font-semibold text-ink-soft">Sering dipakai</p> : null}
            <div className="grid grid-cols-8 gap-0.5">
              {items.map((item) => (
                <button
                  key={item.u}
                  type="button"
                  onClick={() => pick(item)}
                  title={item.n.replace(/_/g, " ")}
                  aria-label={item.n.replace(/_/g, " ")}
                  className="grid h-9 w-full place-items-center rounded-lg text-[1.45rem] leading-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2 focus-visible:outline-none active:scale-95"
                >
                  <EmojiSprite x={item.x} y={item.y} label={item.n} scale={1.35} />
                </button>
              ))}
            </div>
            {popular.length > 0 ? (
              <>
                <p className="px-1 pb-1.5 pt-3 text-2xs font-semibold text-ink-soft">Emoji populer</p>
                <div className="grid grid-cols-8 gap-0.5">
                  {popular.map((item) => (
                    <button
                      key={item.u}
                      type="button"
                      onClick={() => pick(item)}
                      title={item.n.replace(/_/g, " ")}
                      aria-label={item.n.replace(/_/g, " ")}
                      className="grid h-9 w-full place-items-center rounded-lg text-[1.45rem] leading-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2 focus-visible:outline-none active:scale-95"
                    >
                      <EmojiSprite x={item.x} y={item.y} label={item.n} scale={1.35} />
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      <div className="flex items-center gap-0.5 border-t border-line px-1 pb-[env(safe-area-inset-bottom)] pt-1">
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setTab("recent");
          }}
          aria-label="Emoji terakhir dipakai"
          aria-pressed={tab === "recent" && !query}
          className={`grid h-10 flex-1 place-items-center rounded-lg transition-colors ${
            tab === "recent" && !query ? "bg-blush-tint ring-1 ring-blush-deep/30" : "hover:bg-paper-2"
          }`}
        >
          <AppleEmoji sequence="🕘" label="Emoji terakhir dipakai" scale={1.05} />
        </button>
        {TABS.map((t, index) => (
          <button
            key={t.label}
            type="button"
            onClick={() => {
              setQuery("");
              setTab(index);
            }}
            aria-label={t.label}
            aria-pressed={tab === index && !query}
            className={`grid h-10 flex-1 place-items-center rounded-lg transition-colors ${
              tab === index && !query ? "bg-blush-tint ring-1 ring-blush-deep/30" : "hover:bg-paper-2"
            }`}
          >
            <AppleEmoji sequence={t.icon} label={t.label} scale={1.05} />
          </button>
        ))}
      </div>
    </div>
  );
}

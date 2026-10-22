"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

type LiveRow = {
  sessionId: string;
  name: string;
  path: string;
  target: string | null;
  label: string | null;
  device: string;
  browser: string;
  os: string;
  ipMasked: string;
  lastAt: string;
  eventType: "page_view" | "link_click";
};
type LinkRow = { target: string; label: string; clicks: number; ips: number; sessions: number };
type ClickRow = { target: string; label: string; device: string; browser: string; ipMasked: string; at: string };
type CountRow = { device?: string; browser?: string; count: number };
type HourRow = { label: string; views: number; clicks: number };
type ProfileRow = { id: string; name: string; plan: string; verified: boolean; lastActiveAt: string | null };

type Analytics = {
  generatedAt: string;
  truncated?: boolean;
  now: { sessions: number; accounts: number; guests: number; ips: number; people: number };
  last24: { pageViews: number; linkClicks: number; sessions: number; accounts: number; ips: number; clickIps: number };
  bots24: number;
  live: LiveRow[];
  topLinks: LinkRow[];
  recentClicks: ClickRow[];
  devices: CountRow[];
  browsers: CountRow[];
  hourly: HourRow[];
  activeProfiles: ProfileRow[];
};

function timeAgo(iso: string) {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec} dtk lalu`;
  if (sec < 3600) return `${Math.floor(sec / 60)} mnt lalu`;
  return `${Math.floor(sec / 3600)} jam lalu`;
}

function timeWib(iso: string | null) {
  if (!iso) return "belum pernah";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso));
}

function Stat({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="rounded-card border border-line bg-paper p-4">
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-ink">{value}</p>
      {note ? <p className="mt-1 text-xs text-ink-soft">{note}</p> : null}
    </div>
  );
}

export default function AdminLive() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      const json = (await res.json()) as Analytics & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal memuat analitik.");
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat analitik.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(id);
  }, [load]);

  const maxHour = Math.max(1, ...(data?.hourly.map((h) => h.views + h.clicks) ?? [0]));
  const totalDevices = Math.max(1, (data?.devices ?? []).reduce((sum, d) => sum + d.count, 0));

  return (
    <section className="mt-[var(--space-lg)]" aria-label="Analitik pengunjung">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl">Aktivitas langsung</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Data dari pengunjung situs, termasuk tamu yang belum masuk. IP disamarkan; hitungan memakai hash.
            Kunjungan berarti halaman dibuka, sesi berarti satu browser, akun aktif berarti punya aktivitas dalam 24 jam.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-9 items-center rounded-full border border-line bg-paper px-3 text-xs font-semibold text-ink-soft hover:text-ink"
        >
          Muat ulang
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-card border border-blush-deep/40 bg-blush/10 px-3 py-2 text-sm text-blush-deep">{error}</p>
      ) : null}

      {loading && !data ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-card border border-line bg-paper-2" />
          ))}
        </div>
      ) : null}

      {data ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Aktif sekarang" value={data.now.people} note={`${data.now.accounts} akun · ${data.now.guests} tamu`} />
            <Stat label="IP aktif" value={data.now.ips} note="5 menit terakhir" />
            <Stat label="Kunjungan 24 jam" value={data.last24.pageViews} note={`${data.last24.sessions} sesi, ${data.last24.accounts} akun`} />
            <Stat label="Klik tautan 24 jam" value={data.last24.linkClicks} note={`${data.last24.clickIps} IP unik yang klik`} />
          </div>

          {data.bots24 > 0 ? (
            <p className="mt-2 text-2xs text-ink-soft">
              {data.bots24} event bot dikeluarkan dari angka pengunjung.
            </p>
          ) : null}

          <div className="mt-4 rounded-card border border-line bg-paper p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">Trafik 24 jam</h3>
              <span className="text-2xs text-ink-soft">
                {data.generatedAt ? `Diperbarui ${timeWib(data.generatedAt)} WIB` : ""}
              </span>
            </div>
            {data.last24.pageViews + data.last24.linkClicks === 0 ? (
              <p className="mt-4 rounded-[8px] bg-paper-2 px-3 py-6 text-center text-sm text-ink-soft">
                Belum ada kunjungan tercatat dalam 24 jam terakhir.
              </p>
            ) : (
            <div className="mt-4 flex h-32 items-end gap-1" aria-label="Grafik kunjungan per jam">
              {data.hourly.map((h) => (
                <div key={h.label} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-0.5" title={`${h.label}: ${h.views} kunjungan, ${h.clicks} klik`}>
                  <span className="w-full rounded-t-[3px] bg-blush-deep/85" style={{ height: `${(h.views / maxHour) * 100}%` }} />
                  <span className="w-full rounded-b-[3px] bg-ink/70" style={{ height: `${(h.clicks / maxHour) * 100}%` }} />
                </div>
              ))}
            </div>
            )}
            <div className="mt-2 flex items-center justify-between text-2xs text-ink-faint">
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blush-deep" /> kunjungan</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-ink/70" /> klik</span>
              <span>per jam, WIB</span>
            </div>
            <div className="mt-1 flex justify-between text-2xs text-ink-faint">
              {[0, 6, 12, 18, 23].map((i) => (
                <span key={i}>{data.hourly[i]?.label}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="rounded-card border border-line bg-paper p-4">
              <h3 className="text-sm font-semibold text-ink">Sesi langsung (30 menit)</h3>
              {data.live.length === 0 ? (
                <p className="mt-2 text-sm text-ink-soft">Belum ada pengunjung dalam 30 menit terakhir.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {data.live.map((row) => (
                    <li key={row.sessionId} className="flex flex-wrap items-start justify-between gap-2 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">
                          {row.name}
                          <span className="ml-2 text-xs font-normal text-ink-soft">{row.device} · {row.browser}</span>
                        </p>
                        <p className="truncate text-xs text-ink-soft">
                          {row.eventType === "link_click" ? `Klik ${row.label || row.target}` : row.path}
                        </p>
                      </div>
                      <div className="text-right text-2xs text-ink-soft">
                        <p className="font-mono">{row.ipMasked}</p>
                        <p>{timeAgo(row.lastAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-card border border-line bg-paper p-4">
              <h3 className="text-sm font-semibold text-ink">Tautan paling diklik</h3>
              {data.topLinks.length === 0 ? (
                <p className="mt-2 text-sm text-ink-soft">Belum ada klik tautan yang tercatat.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {data.topLinks.map((link) => (
                    <li key={link.target} className="rounded-[8px] bg-paper-2 px-2.5 py-2">
                      <p className="truncate text-xs font-semibold text-ink">{link.label || link.target}</p>
                      <p className="truncate text-2xs text-ink-soft">{link.target}</p>
                      <p className="mt-0.5 text-2xs font-semibold text-ink-soft">
                        {link.clicks} klik · {link.ips} IP · {link.sessions} sesi
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {data.recentClicks.length ? (
                <div className="mt-3 border-t border-line pt-3">
                  <h4 className="text-xs font-semibold text-ink">Klik terbaru</h4>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {data.recentClicks.map((c, i) => (
                      <li key={`${c.at}-${i}`} className="text-2xs text-ink-soft">
                        <span className="font-semibold text-ink">{c.label || c.target}</span> · {c.device} · {c.ipMasked} ·{" "}
                        {timeAgo(c.at)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-card border border-line bg-paper p-4">
              <h3 className="text-sm font-semibold text-ink">Perangkat (24 jam)</h3>
              <div className="mt-3 flex flex-col gap-2">
                {data.devices.length === 0 ? <p className="text-sm text-ink-soft">Belum ada data.</p> : null}
                {data.devices.map((d) => (
                  <div key={d.device}>
                    <div className="flex justify-between text-xs text-ink-soft">
                      <span>{d.device}</span>
                      <span>{d.count} · {Math.round((d.count / totalDevices) * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-3">
                      <span className="block h-full rounded-full bg-ink/70" style={{ width: `${(d.count / totalDevices) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-soft">
                Browser: {data.browsers.length ? data.browsers.map((b) => `${b.browser} (${b.count})`).join(", ") : "belum ada"}
              </p>
            </div>

            <div className="rounded-card border border-line bg-paper p-4">
              <h3 className="text-sm font-semibold text-ink">Akun aktif (24 jam)</h3>
              {data.activeProfiles.length === 0 ? (
                <p className="mt-2 text-sm text-ink-soft">Belum ada akun aktif.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {data.activeProfiles.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <span className="truncate font-semibold text-ink">
                        {p.name}
                        {p.verified ? <Icon name="check" className="ml-1 inline h-3.5 w-3.5 text-verify" /> : null}
                      </span>
                      <span className="shrink-0 text-2xs text-ink-soft">{p.plan} · {timeWib(p.lastActiveAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {data.truncated ? (
            <p className="mt-3 text-xs text-ink-soft">Data 24 jam melebihi 10.000 event; angka di atas adalah batas minimum.</p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

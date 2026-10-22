import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";


type EventRow = {
  session_id: string;
  user_id: string | null;
  event_type: "page_view" | "link_click";
  path: string;
  target: string | null;
  label: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_hash: string | null;
  ip_masked: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  plan: string | null;
  is_verified: string | null;
  last_active_at: string | null;
};

const HOUR = 60 * 60 * 1000;

function keyOf(value: string | null | undefined) {
  return value || "unknown";
}

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "Hanya admin." }, { status: 403 });

  const admin = createAdminSupabase();
  const now = Date.now();
  const since24 = new Date(now - 24 * HOUR).toISOString();
  const [{ data: rawEvents }, { data: rawProfiles }] = await Promise.all([
    admin
      .from("analytics_events")
      .select("session_id, user_id, event_type, path, target, label, device_type, browser, os, ip_hash, ip_masked, created_at")
      .gte("created_at", since24)
      .order("created_at", { ascending: false })
      .limit(10000),
    admin
      .from("profiles")
      .select("id, display_name, plan, is_verified, last_active_at")
      .order("last_active_at", { ascending: false, nullsFirst: false })
      .limit(500),
  ]);

  const allEvents = (rawEvents ?? []) as EventRow[];
  const profiles = (rawProfiles ?? []) as ProfileRow[];
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const names = new Map(profiles.map((p) => [p.id, p.display_name || "Tanpa nama"]));
  // Bot tidak dihitung sebagai pengunjung; angkanya tetap dilaporkan terpisah.
  const events = allEvents.filter((e) => e.device_type !== "Bot");
  const bots24 = allEvents.filter((e) => e.device_type === "Bot").length;
  const lastEventByUser = new Map<string, string>();
  for (const e of events) if (e.user_id && !lastEventByUser.has(e.user_id)) lastEventByUser.set(e.user_id, e.created_at);

  const recent5 = events.filter((e) => new Date(e.created_at).getTime() >= now - 5 * 60 * 1000);
  const recent30 = events.filter((e) => new Date(e.created_at).getTime() >= now - 30 * 60 * 1000);
  // Satu sumber: akun dihitung dari event pengunjung, bukan dari presence profil,
  // supaya angka kartu, sesi langsung, dan daftar akun tidak saling bertentangan.
  const activeAccountIds = new Set<string>();
  for (const e of recent5) if (e.user_id) activeAccountIds.add(e.user_id);
  const accountIds24 = new Set<string>();
  for (const e of events) if (e.user_id) accountIds24.add(e.user_id);

  const sessionSet = (list: EventRow[]) => new Set(list.map((e) => e.session_id));
  const ipSet = (list: EventRow[]) => new Set(list.map((e) => e.ip_hash).filter(Boolean) as string[]);

  const userForSession = new Map<string, string>();
  for (const e of recent30) if (e.user_id && !userForSession.has(e.session_id)) userForSession.set(e.session_id, e.user_id);
  const liveMap = new Map<string, EventRow>();
  for (const e of recent30) {
    // Satu akun tampil sekali walau membuka beberapa tab; tamu tetap per sesi.
    const uid = userForSession.get(e.session_id);
    const key = uid ? `u:${uid}` : `s:${e.session_id}`;
    if (!liveMap.has(key)) liveMap.set(key, e);
  }
  const live = [...liveMap.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)
    .map((e) => ({
      sessionId: e.session_id,
      userId: e.user_id,
      name: e.user_id ? names.get(e.user_id) ?? "Tanpa nama" : "Tamu",
      path: e.path,
      target: e.target,
      label: e.label,
      device: e.device_type || "Lainnya",
      browser: e.browser || "Lainnya",
      os: e.os || "Lainnya",
      ipMasked: e.ip_masked || "tidak diketahui",
      lastAt: e.created_at,
      eventType: e.event_type,
    }));

  const clickIps = new Set<string>(
    events.filter((e) => e.event_type === "link_click" && e.ip_hash).map((e) => e.ip_hash as string),
  );

  const links = new Map<string, { target: string; label: string; clicks: number; ips: Set<string>; sessions: Set<string> }>();
  for (const e of events) {
    if (e.event_type !== "link_click" || !e.target) continue;
    const item = links.get(e.target) ?? {
      target: e.target,
      label: e.label || e.target,
      clicks: 0,
      ips: new Set<string>(),
      sessions: new Set<string>(),
    };
    item.clicks += 1;
    if (e.ip_hash) item.ips.add(e.ip_hash);
    item.sessions.add(e.session_id);
    if (!item.label && e.label) item.label = e.label;
    links.set(e.target, item);
  }
  const topLinks = [...links.values()]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)
    .map((l) => ({ target: l.target, label: l.label, clicks: l.clicks, ips: l.ips.size, sessions: l.sessions.size }));

  const recentClicks = events
    .filter((e) => e.event_type === "link_click")
    .slice(0, 8)
    .map((e) => ({
      target: e.target || "",
      label: e.label || e.target || "",
      device: e.device_type || "Lainnya",
      browser: e.browser || "Lainnya",
      ipMasked: e.ip_masked || "tidak diketahui",
      at: e.created_at,
    }));

  const deviceCounts = new Map<string, number>();
  for (const e of events) {
    if (e.event_type !== "page_view") continue;
    const k = e.device_type || "Lainnya";
    deviceCounts.set(k, (deviceCounts.get(k) ?? 0) + 1);
  }
  const devices = [...deviceCounts.entries()]
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  const browserCounts = new Map<string, number>();
  for (const e of events) {
    if (e.event_type !== "page_view") continue;
    const k = e.browser || "Lainnya";
    browserCounts.set(k, (browserCounts.get(k) ?? 0) + 1);
  }
  const browsers = [...browserCounts.entries()]
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const hourly = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now - (23 - i) * HOUR);
    d.setMinutes(0, 0, 0);
    return {
      key: d.toISOString().slice(0, 13),
      label: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).format(d),
      views: 0,
      clicks: 0,
    };
  });
  const hourMap = new Map(hourly.map((h) => [h.key, h]));
  for (const e of events) {
    const d = new Date(e.created_at);
    d.setMinutes(0, 0, 0);
    const bin = hourMap.get(d.toISOString().slice(0, 13));
    if (!bin) continue;
    if (e.event_type === "page_view") bin.views += 1;
    else bin.clicks += 1;
  }

  const activeProfiles = [...accountIds24]
    .map((id) => profileById.get(id))
    .filter((p): p is ProfileRow => Boolean(p))
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      name: p.display_name || "Tanpa nama",
      plan: p.plan || "free",
      verified: p.is_verified === "approved",
      lastActiveAt: lastEventByUser.get(p.id) ?? p.last_active_at,
    }));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    truncated: allEvents.length >= 10000,
    now: {
      sessions: sessionSet(recent5).size,
      accounts: activeAccountIds.size,
      guests: new Set(recent5.filter((e) => !e.user_id && !userForSession.has(e.session_id)).map((e) => e.session_id)).size,
      ips: ipSet(recent5).size,
      people: activeAccountIds.size + new Set(recent5.filter((e) => !e.user_id && !userForSession.has(e.session_id)).map((e) => e.session_id)).size,
    },
    last24: {
      pageViews: events.filter((e) => e.event_type === "page_view").length,
      linkClicks: events.filter((e) => e.event_type === "link_click").length,
      sessions: sessionSet(events).size,
      accounts: accountIds24.size,
      ips: ipSet(events).size,
      clickIps: clickIps.size,
    },
    bots24,
    live,
    topLinks,
    recentClicks,
    devices,
    browsers,
    hourly,
    activeProfiles,
  });
}

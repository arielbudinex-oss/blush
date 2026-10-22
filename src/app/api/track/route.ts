import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";


const TYPES = new Set(["page_view", "link_click"]);

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : null;
}

function ipInfo(raw: string) {
  const ip = raw.split(",")[0]?.trim() ?? "";
  if (!ip) return { hash: null, masked: null };
  const hash = createHash("sha256").update(ip).digest("hex");
  if (ip === "::1") return { hash, masked: "loopback" };
  if (ip.includes(":")) {
    const groups = ip.split(":").filter(Boolean);
    return { hash, masked: groups.slice(0, 4).join(":") + "::" };
  }
  const parts = ip.split(".");
  return { hash, masked: parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0` : ip };
}

function deviceFromUa(ua: string) {
  const s = ua.toLowerCase();
  const device = /ipad|tablet|playbook|silk/.test(s)
    ? "Tablet"
    : /mobile|iphone|ipod|android.*mobile|windows phone/.test(s)
      ? "HP"
      : /bot|crawler|spider|headless/.test(s)
        ? "Bot"
        : "Desktop";
  const browser = /edg\//.test(s)
    ? "Edge"
    : /opr\/|opera/.test(s)
      ? "Opera"
      : /chrome|crios/.test(s)
        ? "Chrome"
        : /firefox|fxios/.test(s)
          ? "Firefox"
          : /safari/.test(s)
            ? "Safari"
            : "Lainnya";
  const os = /windows/.test(s)
    ? "Windows"
    : /android/.test(s)
      ? "Android"
      : /iphone|ipad|ipod/.test(s)
        ? "iOS"
        : /mac os|macintosh/.test(s)
          ? "macOS"
          : /linux/.test(s)
            ? "Linux"
            : "Lainnya";
  return { device, browser, os };
}

/** Titik masuk data analitik. Hanya server yang menulis, pengunjung tidak bisa membaca. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body bukan JSON." }, { status: 400 });
  }

  const eventType = text(body.eventType, 20);
  const path = text(body.path, 300);
  const sessionId = text(body.sessionId, 80);
  if (!eventType || !TYPES.has(eventType) || !path?.startsWith("/") || !sessionId) {
    return NextResponse.json({ error: "Data event tidak valid." }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    // Pengunjung anonim: tetap dicatat sebagai tamu.
  }

  const ua = request.headers.get("user-agent") ?? "";
  const forwarded = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "";
  const ip = ipInfo(forwarded);
  const device = deviceFromUa(ua);

  const admin = createAdminSupabase();
  const { error } = await admin.from("analytics_events").insert({
    session_id: sessionId,
    user_id: userId,
    event_type: eventType,
    path,
    target: text(body.target, 500),
    label: text(body.label, 120),
    referrer: text(body.referrer, 500),
    device_type: device.device,
    browser: device.browser,
    os: device.os,
    ip_hash: ip.hash,
    ip_masked: ip.masked,
  });

  if (error) return NextResponse.json({ error: "Gagal menyimpan event." }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

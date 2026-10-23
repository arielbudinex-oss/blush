import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { createServerSupabase } from "@/lib/supabase/server";
import { readNonce, verifyGoogleIdToken } from "@/lib/google-oauth";


type OauthCookie = { state: string; nonce: string; next: string; redirectUri: string; scope?: "user" | "admin" };

/**
 * Balikan dari Google. Alurnya: tukar code -> verifikasi ID token ->
 * pastikan user Supabase ada -> terbitkan sesi lewat magic link admin.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const adminFlowCookie = cookieStore.get("blush_oauth_admin")?.value;
  const userFlowCookie = cookieStore.get("blush_oauth")?.value;
  const scope = adminFlowCookie ? "admin" : "user";
  const cookieName = scope === "admin" ? "blush_oauth_admin" : "blush_oauth";
  const flowCookieValue = scope === "admin" ? adminFlowCookie : userFlowCookie;
  const loginUrl = (code: string) => NextResponse.redirect(new URL(`${scope === "admin" ? "/admin/login" : "/login"}?error=${code}`, url.origin));

  const raw = flowCookieValue;
  if (!raw) return loginUrl("google_state");
  let saved: OauthCookie;
  try {
    saved = JSON.parse(raw) as OauthCookie;
  } catch {
    return loginUrl("google_state");
  }

  if (url.searchParams.get("error")) return loginUrl("google_cancelled");
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!code || !state || state !== saved.state) return loginUrl("google_state");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return loginUrl("google_config");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: saved.redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) return loginUrl("google_exchange");

  const token = (await tokenRes.json()) as { id_token?: string };
  if (!token.id_token) return loginUrl("google_exchange");

  let identity;
  try {
    identity = await verifyGoogleIdToken(token.id_token, clientId);
    if (saved.nonce && readNonce(token.id_token) !== saved.nonce) return loginUrl("google_state");
  } catch {
    return loginUrl("google_token");
  }

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  let createdUserId: string | null = null;

  const created = await admin.auth.admin.createUser({
    email: identity.email,
    email_confirm: true,
    user_metadata: {
      full_name: identity.name,
      name: identity.name,
      avatar_url: identity.picture,
      picture: identity.picture,
      provider: "google",
    },
  });
  // email_exists = user sudah pernah masuk; lanjut terbitkan sesi.
  if (created.error && created.error.code !== "email_exists") return loginUrl("google_user");
  createdUserId = created.data.user?.id ?? null;

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email: identity.email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) return loginUrl("google_session");

  let userId: string | undefined;
  if (scope === "admin") {
    const { data: authUser } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = authUser.users.find((candidate) => candidate.email?.toLowerCase() === identity.email.toLowerCase())?.id;
    if (!userId) return loginUrl("google_session");
    const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (profile?.role !== "admin") {
      if (createdUserId && createdUserId === userId) await admin.auth.admin.deleteUser(userId);
      return loginUrl("admin_required");
    }
  } else {
    const supabase = await createServerSupabase("user");
    const { data: session, error: verifyError } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    if (verifyError) return loginUrl("google_session");
    userId = session.user?.id;
  }
  // Onboarding tidak boleh mulai dengan nama kosong kalau Google sudah memberi nama.
  if (userId) {
    const alias = identity.name.split(" ")[0]?.slice(0, 32) || "";
    if (alias) {
      await admin
        .from("profiles")
        .update({ display_name: alias })
        .eq("id", userId)
        .eq("display_name", "");
    }
  }

  const { data: me } = await admin.from("profiles").select("onboarded_at, role").eq("id", userId ?? "").maybeSingle();
  const wanted = saved.next.startsWith("/") && !saved.next.startsWith("//") ? saved.next : (scope === "admin" ? "/admin" : "/app/discover");
  // Akun lama yang sudah onboarding tidak dikirim ke form pendaftaran lagi.
  // Akun yang belum onboarding dan masuk lewat tombol Masuk tetap melihat
  // halaman login dengan pilihan lanjut pendaftaran atau ganti akun.
  const next = scope === "admin"
    ? wanted.startsWith("/admin") ? wanted : "/admin"
    : !me?.onboarded_at && wanted === "/app/discover"
      ? "/login?incomplete=1"
      : wanted === "/onboarding" && me?.onboarded_at
        ? "/app/discover"
        : wanted;
  const response = NextResponse.redirect(new URL(next, url.origin));
  if (scope === "admin" && userId) {
    const adminSessionLink = await admin.auth.admin.generateLink({ type: "magiclink", email: identity.email });
    const adminTokenHash = adminSessionLink.data?.properties?.hashed_token;
    if (adminSessionLink.error || !adminTokenHash) return loginUrl("google_session");

    const cookieOptions = { path: "/", sameSite: "lax" as const, secure: url.protocol === "https:", httpOnly: true };
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookieOptions: { name: "blush-admin-auth" },
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, { ...options, ...cookieOptions });
            }
          },
        },
      },
    );
    const { error: sessionError } = await adminClient.auth.verifyOtp({ type: "magiclink", token_hash: adminTokenHash });
    if (sessionError) return loginUrl("google_session");
  }
  response.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
  return response;
}

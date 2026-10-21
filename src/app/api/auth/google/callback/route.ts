import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { readNonce, verifyGoogleIdToken } from "@/lib/google-oauth";


type OauthCookie = { state: string; nonce: string; next: string; redirectUri: string };

/**
 * Balikan dari Google. Alurnya: tukar code -> verifikasi ID token ->
 * pastikan user Supabase ada -> terbitkan sesi lewat magic link admin.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const loginUrl = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, url.origin));

  const raw = (await cookies()).get("blush_oauth")?.value;
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

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email: identity.email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) return loginUrl("google_session");

  const supabase = await createServerSupabase();
  const { data: session, error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyError) return loginUrl("google_session");

  // Onboarding tidak boleh mulai dengan nama kosong kalau Google sudah memberi nama.
  const userId = session.user?.id;
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

  const next = saved.next.startsWith("/") ? saved.next : "/app/discover";
  const response = NextResponse.redirect(new URL(next, url.origin));
  response.cookies.set("blush_oauth", "", { path: "/", maxAge: 0 });
  return response;
}

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";


/** Mulai login lewat Google: simpan state + nonce, lalu lempar ke account chooser. */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google_config", new URL(request.url).origin));
  }

  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/app/discover";
  const state = randomUUID();
  const nonce = randomUUID();
  const redirectUri = new URL("/api/auth/google/callback", url.origin).toString();

  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid email profile");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("nonce", nonce);
  authorize.searchParams.set("prompt", "select_account");
  authorize.searchParams.set("access_type", "online");

  const response = NextResponse.redirect(authorize.toString());
  response.cookies.set("blush_oauth", JSON.stringify({ state, nonce, next, redirectUri }), {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 600,
  });
  return response;
}

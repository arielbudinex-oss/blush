/**
 * Verifikasi ID token Google (OpenID Connect) tanpa library tambahan.
 * Dipakai karena provider Google di Supabase belum aktif; alur tetap
 * memakai identitas Google asli (email terverifikasi Google).
 */

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

type Jwk = { kid: string; n: string; e: string; kty: string };
let cache: { keys: Jwk[]; at: number } | null = null;

async function jwks(): Promise<Jwk[]> {
  if (cache && Date.now() - cache.at < 3_600_000) return cache.keys;
  const res = await fetch(JWKS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("jwks_unreachable");
  const body = (await res.json()) as { keys: Jwk[] };
  cache = { keys: body.keys, at: Date.now() };
  return body.keys;
}

function b64url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

/** Salin byte ke ArrayBuffer murni supaya cocok dengan tipe WebCrypto. */
function bytes(input: Buffer | Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(input.byteLength);
  new Uint8Array(out).set(input);
  return out;
}

export type GoogleIdentity = {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
};

export async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<GoogleIdentity> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("token_malformed");
  const [rawHeader, rawPayload, rawSig] = parts;

  const header = JSON.parse(b64url(rawHeader).toString("utf8")) as { alg?: string; kid?: string };
  if (header.alg !== "RS256" || !header.kid) throw new Error("token_alg");

  const payload = JSON.parse(b64url(rawPayload).toString("utf8")) as {
    iss?: string;
    aud?: string;
    exp?: number;
    nonce?: string;
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    picture?: string;
  };

  if (!payload.iss || !ISSUERS.has(payload.iss)) throw new Error("token_issuer");
  if (payload.aud !== clientId) throw new Error("token_audience");
  if (!payload.exp || payload.exp * 1000 <= Date.now()) throw new Error("token_expired");
  if (payload.email_verified !== true && payload.email_verified !== "true") throw new Error("email_unverified");
  if (!payload.email || !payload.sub) throw new Error("token_incomplete");

  const jwk = (await jwks()).find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("token_key_unknown");

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    bytes(b64url(rawSig)),
    bytes(Buffer.from(`${rawHeader}.${rawPayload}`, "utf8")),
  );
  if (!valid) throw new Error("token_signature");

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name?.trim() || payload.email.split("@")[0],
    picture: payload.picture ?? null,
  };
}

/** Nonce dari payload harus sama dengan nonce yang kita kirim saat mulai login. */
export function readNonce(idToken: string): string | null {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    return (JSON.parse(b64url(payload).toString("utf8")) as { nonce?: string }).nonce ?? null;
  } catch {
    return null;
  }
}

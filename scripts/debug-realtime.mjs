/** Debug realtime: apakah event INSERT messages sampai ke klien terautentikasi? */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const svc = env.SUPABASE_SERVICE_ROLE_KEY;

const sub = createClient(url, key, { auth: { persistSession: false } });
const { data: signIn, error: signErr } = await sub.auth.signInWithPassword({
  email: "damar@blush.test",
  password: "BlushTest!2026",
});
console.log("sign-in damar:", signErr ? signErr.message : "ok");

const admin = createClient(url, svc, { auth: { persistSession: false } });
const { data: matches } = await admin.from("matches").select("id, user_a, user_b").limit(1);
if (!matches?.length) {
  console.log("tidak ada match untuk diuji");
  process.exit(0);
}
const match = matches[0];
const sender = match.user_a; // Rara

let received = null;
const channel = sub
  .channel(`debug-${match.id}`)
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${match.id}` },
    (payload) => {
      received = payload.new.body;
    },
  )
  .subscribe((status, err) => console.log("channel status:", status, err?.message ?? ""));

await new Promise((r) => setTimeout(r, 4000));
const { error: insErr } = await admin.from("messages").insert({
  match_id: match.id,
  sender_id: sender,
  body: `uji realtime ${new Date().toISOString()}`,
});
console.log("insert dari Rara:", insErr ? insErr.message : "ok");

for (let i = 0; i < 8 && !received; i++) await new Promise((r) => setTimeout(r, 1000));
console.log(received ? `REALTIME OK — diterima: ${received}` : "REALTIME GAGAL — event tidak diterima");
await sub.removeChannel(channel);
process.exit(0);

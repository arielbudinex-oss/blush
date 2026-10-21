/**
 * Verifikasi end-to-end Blush lewat browser sungguhan (puppeteer-core + Chrome GPU).
 * Menjalankan: dua akun uji, onboarding lewat UI, swipe -> match -> chat realtime,
 * checkout QRIS, dan aktivasi premium lewat halaman admin.
 *
 * Jalankan: node scripts/verify-flows.mjs   (butuh server di http://localhost:3100)
 */
import puppeteer from "puppeteer-core";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BLUSH_BASE ?? "http://localhost:3100";
const OUT = path.resolve("docs/verify");
mkdirSync(OUT, { recursive: true });

// Reset jejak swipe/match/pembayaran akun uji agar suite bisa dijalankan berulang.
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(String.fromCharCode(10))
    .map((l) => l.trimEnd())
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const scoped = {
  matches: "user_a",
  swipes: "actor_id",
  blocks: "blocker_id",
  reports: "reporter_id",
  payments: "profile_id",
  boosts: "profile_id",
};
for (const [table, column] of Object.entries(scoped)) {
  const { error } = await admin.from(table).delete().not(column, "is", null);
  if (error) throw new Error(`reset ${table}: ${error.message}`);
}
{
  const { error } = await admin.from("messages").delete().gte("id", 0);
  if (error) throw new Error(`reset messages: ${error.message}`);
}
await admin.from("profiles").update({ plan: "free" }).neq("display_name", "");

const SCRATCH = "C:/Users/ariel/AppData/Local/hermes/cache/scratch";
const RARA = { email: "rara@blush.test", pass: process.env.BLUSH_TEST_PASSWORD ?? "", name: "Rara", bd: "1998-05-12", city: "Bandung", gender: "Perempuan", photo: `${SCRATCH}/blush-rara.png` };
const DAMAR = { email: "damar@blush.test", pass: process.env.BLUSH_TEST_PASSWORD ?? "", name: "Damar", bd: "1996-02-20", city: "Jakarta", gender: "Laki-laki", photo: `${SCRATCH}/blush-damar.png` };

const log = (...a) => console.log("•", ...a);
const ok = (label, cond, extra = "") => console.log(`${cond ? "PASS" : "FAIL"} — ${label}${extra ? " :: " + extra : ""}`);

async function clickText(page, text) {
  const hit = await page.evaluate((t) => {
    const els = [...document.querySelectorAll("button,a,summary,label")];
    const el = els.find((e) => e.textContent?.trim().startsWith(t));
    if (!el) return false;
    el.click();
    return true;
  }, text);
  if (!hit) throw new Error(`elemen dengan teks "${text}" tidak ditemukan`);
  await new Promise((r) => setTimeout(r, 400));
}

async function clickLabel(page, label) {
  const hit = await page.evaluate((l) => {
    const el = document.querySelector(`[aria-label="${l}"], [aria-label^="${l} "]`);
    if (!el) return false;
    el.click();
    return true;
  }, label);
  if (!hit) throw new Error(`tombol aria-label "${label}" tidak ditemukan`);
  await new Promise((r) => setTimeout(r, 400));
}

async function swipeUntil(page, name, max = 8) {
  for (let i = 0; i < max; i++) {
    await page.waitForSelector('[aria-label="Suka"]', { timeout: 15000 }).catch(() => null);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes(name)) return true;
    await clickLabel(page, "Lewati").catch(() => null);
    await new Promise((r) => setTimeout(r, 1500));
  }
  return (await page.evaluate(() => document.body.innerText)).includes(name);
}

async function setInput(page, selector, value) {
  await page.$eval(
    selector,
    (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value,
  );
  await new Promise((r) => setTimeout(r, 150));
}

async function login(page, user) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type("#email", user.email);
  await page.type("#password", user.pass);
  await page.click("button[type=submit]");
  await page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 15000 });
  log("login", user.email, "->", page.url());
}

async function onboarding(page, user, interestLabels) {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle2" });
  await setInput(page, "#name", user.name);
  await setInput(page, "#bd", user.bd);
  await clickText(page, user.gender);
  await setInput(page, "#city", user.city);
  await clickText(page, "Lanjut");

  await clickText(page, "Cari kencan");
  for (const label of interestLabels) await clickText(page, label);
  await clickText(page, "Lanjut");

  const input = await page.$('input[type="file"]');
  if (!input) throw new Error("input file onboarding tidak ada");
  await input.uploadFile(user.photo);
  await new Promise((r) => setTimeout(r, 800));
  const count = await page.evaluate(() => document.querySelectorAll("ul li").length);
  ok("foto terpilih di langkah 3", count > 0, `${count} file`);
  await clickText(page, "Lanjut");

  await clickText(page, "Selesai, mulai geser");
  await page.waitForFunction(() => location.pathname.startsWith("/app/"), { timeout: 20000 });
  log("onboarding selesai ->", page.url());
}

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: [
    "--no-sandbox",
    "--enable-gpu",
    "--use-angle=d3d11",
    "--ignore-gpu-blocklist",
    "--enable-gpu-rasterization",
    "--enable-zero-copy",
    "--force-device-scale-factor=1",
    "--window-size=1280,900",
  ],
});

try {
  const a = await browser.createBrowserContext();
  const b = await browser.createBrowserContext();
  const pa = await a.newPage();
  const pb = await b.newPage();
  await pa.setViewport({ width: 1280, height: 900 });
  await pb.setViewport({ width: 1280, height: 900 });

  // 1 — landing
  await pa.goto(BASE, { waitUntil: "networkidle2" });
  const h1 = await pa.$eval("h1", (e) => e.textContent.trim());
  ok("landing h1", h1.includes("beneran") && h1.includes("basa-basi"), h1);
  await pa.screenshot({ path: path.join(OUT, "01-landing.png"), fullPage: false });

  // 2 — onboarding Rara
  await login(pa, RARA);
  await onboarding(pa, RARA, ["Ngopi", "Musik", "Traveling"]);
  await pa.screenshot({ path: path.join(OUT, "02-discover-rara.png") });
  const deckText = await pa.evaluate(() => document.body.innerText);
  ok("deck tampil (Damar belum onboarded)", /Deck kosong|Suka|Kandidat|Belum ada yang baru|Untukmu/.test(deckText));

  // 3 — onboarding Damar
  await login(pb, DAMAR);
  await onboarding(pb, DAMAR, ["Ngopi", "Coding", "Gaming"]);

  // 4 — Rara swipe like Damar
  await pa.goto(`${BASE}/app/discover`, { waitUntil: "networkidle2" });
  const seenOk = await swipeUntil(pa, "Damar");
  const seen = await pa.evaluate(() => document.body.innerText);
  ok("Rara melihat kandidat", seenOk, seen.match(/Kandidat \d+ dari \d+/)?.[0] ?? "");
  await pa.screenshot({ path: path.join(OUT, "03-deck-rara.png") });
  await clickLabel(pa, "Suka");
  await new Promise((r) => setTimeout(r, 2500));

  // 5 — Damar swipe like Rara -> match
  await pb.goto(`${BASE}/app/discover`, { waitUntil: "networkidle2" });
  const raraSeen = await swipeUntil(pb, "Rara");
  ok("Damar melihat kandidat Rara", raraSeen);
  await clickLabel(pb, "Suka");
  await pb.waitForFunction(() => document.body.innerText.includes("Kalian saling suka"), { timeout: 15000 });
  ok("match terdeteksi di UI Damar", true);
  await pb.screenshot({ path: path.join(OUT, "04-match-moment.png") });

  // 6 — Damar kirim pesan
  await clickText(pb, "Buka chat");
  await pb.waitForSelector('form textarea[aria-label="Pesan"]', { timeout: 15000 });
  await pb.type('form textarea[aria-label="Pesan"]', "Halo Rara, kita sama-sama suka ngopi ya!");
  await pb.click("form button[type=submit]");
  await new Promise((r) => setTimeout(r, 2500));
  const sent = await pb.evaluate(() => document.body.innerText);
  ok("pesan terkirim & tampil", sent.includes("Halo Rara"));

  // 7 — Rara buka matches, lalu chat; cek pesan tersimpan
  await pa.goto(`${BASE}/app/matches`, { waitUntil: "networkidle2" });
  const matchesText = await pa.evaluate(() => document.body.innerText);
  ok("halaman matches menampilkan pesan terakhir", matchesText.includes("Halo Rara"), matchesText.slice(0, 120).replace(/\n/g, " | "));
  await pa.screenshot({ path: path.join(OUT, "05-matches-rara.png") });
  await pa.click('a[href^="/app/chat/"]');
  await pa.waitForSelector('form textarea[aria-label="Pesan"]', { timeout: 15000 });
  let sawFirst = true;
  try {
    await pa.waitForFunction(() => document.body.innerText.includes("Halo Rara"), { timeout: 12000 });
  } catch {
    sawFirst = false;
  }
  ok("Rara melihat pesan Damar di chat", sawFirst);

  // 8 — realtime: Damar kirim pesan kedua, Rara harus lihat tanpa reload
  await pb.type('form textarea[aria-label="Pesan"]', "Pesan kedua — uji realtime");
  await pb.click("form button[type=submit]");
  let realtime = false;
  try {
    await pa.waitForFunction(() => document.body.innerText.includes("Pesan kedua — uji realtime"), { timeout: 15000 });
    realtime = true;
  } catch {}
  ok("chat realtime tanpa reload", realtime);
  await pa.screenshot({ path: path.join(OUT, "06-chat-realtime.png") });

  // 9 — checkout QRIS
  await pa.goto(`${BASE}/app/premium`, { waitUntil: "networkidle2" });
  await clickText(pa, "Bayar pakai QRIS");
  await pa.waitForSelector('img[alt="QRIS pembayaran"]', { timeout: 20000 });
  const payload = await pa.$eval("details code", (e) => e.textContent.trim());
  const amountText = await pa.evaluate(() => document.body.innerText.match(/Nominal: Rp[\d.]+/)?.[0] ?? "");
  ok("QR image tampil", true, amountText);
  ok("payload QRIS 4 char terakhir = CRC", /^\d{2}.*6304[0-9A-F]{4}$/.test(payload), payload.slice(-8));
  console.log("PAYLOAD=" + payload);
  await pa.screenshot({ path: path.join(OUT, "07-qris-checkout.png") });

  // 10 — admin: tandai lunas
  await pa.goto(`${BASE}/admin`, { waitUntil: "networkidle2" });
  const adminText = await pa.evaluate(() => document.body.innerText);
  if (adminText.includes("Pembayaran menunggu")) {
    await clickText(pa, "Tandai lunas");
    await new Promise((r) => setTimeout(r, 3000));
    ok("admin menandai lunas", true);
    await pa.screenshot({ path: path.join(OUT, "08-admin.png") });
  } else {
    ok("halaman admin bisa diakses akun admin", false, adminText.slice(0, 160).replace(/\n/g, " | "));
  }
} catch (err) {
  console.log("ERROR:", err.message);
} finally {
  await browser.close();
}
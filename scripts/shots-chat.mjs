/**
 * Screenshot room chat pertama milik akun uji (mobile + desktop).
 * Rara ikut masuk dan membalas, supaya tampilan punya dua sisi percakapan
 * sekaligus membuktikan realtime + status dibaca.
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BLUSH_BASE ?? "http://localhost:3105";
const OUT = "docs/verify/shots";
const PASS = process.env.BLUSH_TEST_PASSWORD;
if (!PASS) throw new Error("BLUSH_TEST_PASSWORD belum diisi");
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--force-device-scale-factor=1"],
});

async function login(page, email, width, height) {
  await page.setViewport({ width, height, isMobile: width < 768, hasTouch: width < 768 });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type("#email", email);
  await page.type("#password", PASS);
  await page.click("button[type=submit]");
  await page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 20000 });
}

async function send(page, text) {
  await page.waitForSelector('form textarea[aria-label="Pesan"]', { timeout: 15000 });
  await page.type('form textarea[aria-label="Pesan"]', text);
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 700));
}

const mine = await browser.newPage();
await login(mine, "damar@blush.test", 390, 844);
await mine.goto(`${BASE}/app/matches`, { waitUntil: "networkidle2" });
const href = await mine.evaluate(() => document.querySelector('a[href^="/app/chat/"]')?.getAttribute("href") ?? null);

if (!href) {
  console.log("Tidak ada match aktif untuk damar — chat tidak bisa dipotret.");
} else {
  await mine.goto(`${BASE}${href}`, { waitUntil: "networkidle2" });
  await send(mine, "Kalau jadi ke Bromo bulan depan, kamu ikut lagi?");
  await send(mine, "Aku bawa termos kopi. Biar nggak kedinginan di penanjakan.");

  const peer = await browser.newPage();
  await login(peer, "rara@blush.test", 390, 844);
  await peer.goto(`${BASE}${href}`, { waitUntil: "networkidle2" });
  await send(peer, "Boleh. Tapi aku nggak janji bangun jam tiga.");
  await send(peer, "Jam empat cukup. Jangan lupa sarung tangan.");
  await new Promise((r) => setTimeout(r, 1200));

  await mine.bringToFront();
  await new Promise((r) => setTimeout(r, 900));
  await mine.screenshot({ path: `${OUT}/mobile-11-chat.png` });
  console.log("chat:", href);

  await mine.setViewport({ width: 1280, height: 900, isMobile: false, hasTouch: false });
  await new Promise((r) => setTimeout(r, 600));
  await mine.screenshot({ path: `${OUT}/desktop-11-chat.png` });
}
await browser.close();
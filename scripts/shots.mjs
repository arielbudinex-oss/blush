/** Tangkap layar semua halaman utama di viewport ponsel & desktop untuk audit visual. */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BLUSH_BASE ?? "http://localhost:3105";
const OUT = path.resolve("docs/verify/shots");
mkdirSync(OUT, { recursive: true });
const PASS = "BlushTest!2026";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--force-device-scale-factor=1"],
});

const views = [
  { name: "mobile", width: 390, height: 844, mobile: true },
  { name: "desktop", width: 1280, height: 900, mobile: false },
];

async function login(page, email = "damar@blush.test") {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type("#email", email);
  await page.type("#password", PASS);
  await page.click("button[type=submit]");
  await page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 20000 });
}

for (const v of views) {
  const page = await browser.newPage();
  await page.setViewport({ width: v.width, height: v.height, isMobile: v.mobile, deviceScaleFactor: 1, hasTouch: v.mobile });

  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(OUT, `${v.name}-01-landing.png`) });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(OUT, `${v.name}-02-login.png`) });

  await login(page);
  for (const [file, url] of [
    ["04-discover", "/app/discover"],
    ["05-likes", "/app/likes"],
    ["06-matches", "/app/matches"],
    ["07-profile", "/app/profile"],
    ["08-premium", "/app/premium"],
    ["09-settings", "/app/settings"],
    ["10-verify", "/app/verify"],
  ]) {
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: path.join(OUT, `${v.name}-${file}.png`) });
  }
  await page.close();
}

// Reduced motion: konten tidak boleh hilang.
const rm = await browser.newPage();
await rm.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await rm.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await login(rm);
await rm.goto(`${BASE}/app/discover`, { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 900));
const rmText = await rm.evaluate(() => document.body.innerText);
const rmInfo = await rm.evaluate(() => {
  const card = document.querySelector("article, [data-deck-card], .deck-card");
  return { count: document.querySelectorAll("article, [data-deck-card], .deck-card").length, opacity: card ? getComputedStyle(card).opacity : "none" };
});
await rm.screenshot({ path: path.join(OUT, "mobile-11-reduced-motion.png") });
console.log("reduced-motion kandidat:", /Kandidat|Deck kosong/.test(rmText), rmInfo);

await browser.close();

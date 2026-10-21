/** Screenshot room chat pertama milik akun uji (mobile + desktop). */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BLUSH_BASE ?? "http://localhost:3105";
const OUT = "docs/verify/shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--force-device-scale-factor=1"],
});

async function login(page, width, height) {
  await page.setViewport({ width, height, isMobile: width < 768, hasTouch: width < 768 });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type("#email", "damar@blush.test");
  await page.type("#password", "BlushTest!2026");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 20000 });
}

const page = await browser.newPage();
await login(page, 390, 844);
await page.goto(`${BASE}/app/matches`, { waitUntil: "networkidle2" });
const href = await page.evaluate(() => document.querySelector('a[href^="/app/chat/"]')?.getAttribute("href") ?? null);
if (!href) {
  console.log("Tidak ada match aktif untuk damar — chat tidak bisa dipotret.");
} else {
  await page.goto(`${BASE}${href}`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `${OUT}/mobile-11-chat.png` });
  console.log("chat:", href);

  await page.setViewport({ width: 1280, height: 900, isMobile: false, hasTouch: false });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${OUT}/desktop-11-chat.png` });
}
await browser.close();

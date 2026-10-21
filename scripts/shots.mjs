/** Tangkapan layar ringkas untuk laporan (landing + deck + premium). */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BLUSH_BASE ?? "http://localhost:3104";
const OUT = path.resolve("docs/verify");
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1280,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

await page.goto(BASE, { waitUntil: "networkidle2" });
await page.screenshot({ path: path.join(OUT, "10-landing-final.png") });
console.log("landing ok");

await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
await page.type("#email", "rara@blush.test");
await page.type("#password", "BlushTest!2026");
await page.click("button[type=submit]");
await page.waitForFunction(() => location.pathname.startsWith("/app/"), { timeout: 15000 });

await page.goto(`${BASE}/app/premium`, { waitUntil: "networkidle2" });
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Bayar pakai QRIS");
  b?.click();
});
await page.waitForSelector('img[alt="QRIS pembayaran"]', { timeout: 20000 });
const info = await page.evaluate(() => document.body.innerText.match(/Nominal:.*/)?.[0] ?? "");
console.log("premium:", info);
await page.screenshot({ path: path.join(OUT, "11-premium-final.png") });

await page.goto(`${BASE}/app/settings`, { waitUntil: "networkidle2" });
await page.screenshot({ path: path.join(OUT, "12-settings-final.png") });
console.log("settings ok");

await browser.close();

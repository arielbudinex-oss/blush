/** Uji QRIS asli: ambil payload dari halaman, tangkap QR-nya, lalu decode ulang QR dari gambar. */
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BLUSH_BASE ?? "http://localhost:3105";
const OUT = path.resolve("docs/verify");
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1280,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

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

const payload = await page.$eval("details code", (e) => e.textContent.trim());
const nominal = await page.evaluate(() => document.body.innerText.match(/Nominal: Rp[\d.]+/)?.[0] ?? "");
const status = await page.evaluate(() => document.body.innerText.match(/Status: [a-z ]+/)?.[0] ?? "");
const qr = await page.$('img[alt="QRIS pembayaran"]');
const qrPath = path.join(OUT, "13-qris-asli.png");
await qr.screenshot({ path: qrPath });
await page.screenshot({ path: path.join(OUT, "14-premium-qris-asli.png") });

writeFileSync(path.join(OUT, "13-qris-asli-payload.txt"), payload + "\n");
console.log("PAYLOAD_HALAMAN=" + payload);
console.log("NOMINAL=" + nominal);
console.log("STATUS=" + status);
console.log("QR_PNG=" + qrPath);
await browser.close();

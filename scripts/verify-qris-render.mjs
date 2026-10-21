/** Ambil QR yang benar-benar dikirim ke browser (data URL) lalu simpan PNG 512px untuk didekode ulang. */
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
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 3 });

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
const dataUrl = await page.$eval('img[alt="QRIS pembayaran"]', (e) => e.src);
writeFileSync(path.join(OUT, "15-qris-dataurl.png"), Buffer.from(dataUrl.split(",")[1], "base64"));
writeFileSync(path.join(OUT, "15-qris-dataurl-payload.txt"), payload + "\n");
await page.screenshot({ path: path.join(OUT, "16-premium-qris-asli-hi.png") });
console.log("dataURL disimpan (base64 " + dataUrl.length + " char)");
console.log("PAYLOAD=" + payload);
await browser.close();

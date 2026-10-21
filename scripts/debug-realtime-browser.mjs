/** Debug realtime di browser: dua pengguna, satu match, cek apakah pesan muncul tanpa reload. */
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";

const BASE = process.env.BLUSH_BASE ?? "http://localhost:3102";
const match = JSON.parse(readFileSync(".test-match.json", "utf8"))[0];

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1280,900"],
});

async function login(email) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on("console", (m) => {
    const t = m.text();
    if (/realtime|websocket|error/i.test(t)) console.log(`  [${email}]`, m.type(), t.slice(0, 200));
  });
  page.on("pageerror", (e) => console.log(`  [${email} pageerror]`, e.message));
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type("#email", email);
  await page.type("#password", process.env.BLUSH_TEST_PASSWORD ?? "");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 15000 });
  return page;
}

const rara = await login("rara@blush.test");
const damar = await login("damar@blush.test");

await rara.goto(`${BASE}/app/chat/${match.id}`, { waitUntil: "networkidle2" });
await rara.waitForSelector("form input[aria-label=Pesan]", { timeout: 15000 });
await damar.goto(`${BASE}/app/chat/${match.id}`, { waitUntil: "networkidle2" });
await damar.waitForSelector("form input[aria-label=Pesan]", { timeout: 15000 });
console.log("kedua halaman chat terbuka");

const text = `realtime-browser ${Date.now()}`;
await damar.type("form input[aria-label=Pesan]", text);
await damar.click("form button[type=submit]");
console.log("damar mengirim:", text);

let ok = false;
for (let i = 0; i < 12 && !ok; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  ok = await rara.evaluate((t) => document.body.innerText.includes(t), text);
  if (i % 3 === 0) console.log(`  cek t+${i}s: ${ok ? "muncul" : "belum"}`);
}
console.log(ok ? "REALTIME BROWSER OK" : "REALTIME BROWSER GAGAL");
await browser.close();
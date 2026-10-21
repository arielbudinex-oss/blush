/** Debug: kenapa modal match tidak muncul di sisi pengguna yang menekan Suka terakhir. */
import puppeteer from "puppeteer-core";

const BASE = process.env.BLUSH_BASE ?? "http://localhost:3101";
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1280,900"],
});
const page = await browser.newPage();
page.on("console", (m) => console.log("  [page]", m.type(), m.text()));
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));
page.on("requestfailed", (r) => console.log("  [reqfail]", r.url().slice(0, 120), r.failure()?.errorText));

await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
await page.type("#email", "damar@blush.test");
await page.type("#password", "BlushTest!2026");
await page.click("button[type=submit]");
await page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 15000 });

await page.goto(`${BASE}/app/discover`, { waitUntil: "networkidle2" });
const before = await page.evaluate(() => ({
  buttons: [...document.querySelectorAll("button")].map((b) => b.textContent.trim()),
  text: document.body.innerText.slice(0, 300),
}));
console.log("buttons:", JSON.stringify(before.buttons));
console.log("text:", before.text.replace(/\n/g, " | "));

const clicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Suka");
  if (!b) return false;
  b.click();
  return true;
});
console.log("clicked Suka:", clicked);

for (let i = 1; i <= 6; i++) {
  await new Promise((r) => setTimeout(r, 1500));
  const state = await page.evaluate(() => ({
    modal: document.body.innerText.includes("Kalian saling suka"),
    tail: document.body.innerText.replace(/\n/g, " | ").slice(0, 260),
  }));
  console.log(`t+${i * 1.5}s modal=${state.modal} :: ${state.tail}`);
  if (state.modal) break;
}
await browser.close();

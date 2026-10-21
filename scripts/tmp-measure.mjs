import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe", headless:"new", args:["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width:390, height:844, deviceScaleFactor:2 });
await p.goto("http://localhost:3105/login", { waitUntil:"networkidle0" });
await p.type("#email", "rara@blush.test");
await p.type("#password", "BlushTest!2026");
await Promise.all([p.waitForFunction(() => !location.pathname.startsWith("/login"), {timeout:20000}), p.click('button[type="submit"]')]);
await p.goto("http://localhost:3105/app/discover", { waitUntil:"networkidle0" });
await new Promise(r=>setTimeout(r,1200));
const m = await p.evaluate(() => {
  const rect = s => { const el=document.querySelector(s); if(!el) return null; const r=el.getBoundingClientRect(); return {top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height)}; };
  return { vh: innerHeight, article: rect("article"), photo: rect(".deck-photo"), actions: rect("article .flex.items-center.justify-center"), hint: rect("article p:last-of-type"), nav: rect("nav"), main: rect("main") };
});
console.log(JSON.stringify(m,null,2));
await b.close();

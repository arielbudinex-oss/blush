/** Audit kontras teks normal + saat hover di semua halaman utama.
 * Teks di atas foto/gradient tidak dinilai dari backgroundColor (selalu putih);
 * piksel di belakang teks diambil dari screenshot elemen dengan teks disembunyikan.
 */
import puppeteer from "puppeteer-core";
import { PNG } from "pngjs";

const BASE = process.env.BLUSH_BASE ?? "http://localhost:3105";
const PASS = "BlushTest!2026";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--force-device-scale-factor=1"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
await page.type("#email", "damar@blush.test");
await page.type("#password", PASS);
await page.click("button[type=submit]");
await page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 20000 });

const PAGES = ["/", "/login", "/app/discover", "/app/likes", "/app/matches", "/app/profile", "/app/premium", "/app/settings", "/app/verify"];
const issues = [];

function probe() {
  function parse(c) {
    const m = c.match(/rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\)/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    if (!c || c === "transparent" || c === "none") return null;
    try {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      if (!d[3]) return null;
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    } catch {
      return null;
    }
  }
  function lum({ r, g, b }) {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function ratio(a, b) {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function backdrop(el) {
    const tr = el.getBoundingClientRect();
    const own = parse(getComputedStyle(el).backgroundColor);
    if (own && own.a > 0.85) return { bg: own };
    for (let p = el.parentElement; p; p = p.parentElement) {
      for (const c of p.children) {
        if (c === el || c.contains(el)) continue;
        const cs = getComputedStyle(c);
        if (c.tagName !== "IMG") {
          if (cs.position !== "absolute" || cs.backgroundImage === "none") continue;
        }
        const r = c.getBoundingClientRect();
        if (r.left <= tr.left && r.right >= tr.right && r.top <= tr.top && r.bottom >= tr.bottom) return { media: true };
      }
    }
    let n = el;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== "none" || n.tagName === "IMG") return { media: true };
      const bg = parse(s.backgroundColor);
      if (bg && bg.a > 0.85) return { bg };
      n = n.parentElement;
    }
    return { bg: parse(getComputedStyle(document.body).backgroundColor) ?? { r: 255, g: 255, b: 255, a: 1 } };
  }
  const out = [];
  const nodes = document.querySelectorAll("a, button, summary, label, p, span, li, h1, h2, h3");
  for (const el of nodes) {
    if (!el.textContent || !el.textContent.trim()) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || +s.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.top < -200 || r.top > 6000) continue;
    const fg = parse(s.color);
    if (!fg) continue;
    const back = backdrop(el);
    const id = `ct-${out.length}`;
    el.setAttribute("data-ct", id);
    const size = parseFloat(s.fontSize);
    const bold = +s.fontWeight >= 600;
    out.push({
      id,
      text: el.textContent.trim().slice(0, 40),
      tag: el.tagName,
      fg: s.color,
      fgLum: lum(fg),
      bg: back.media ? null : `rgb(${back.bg.r}, ${back.bg.g}, ${back.bg.b})`,
      contrast: back.media ? null : +ratio(fg, back.bg).toFixed(2),
      media: !!back.media,
      size,
      large: size >= 24 || (size >= 18.66 && bold),
    });
  }
  return out;
}

/** Rata-rata luminansi piksel di belakang teks (teks disembunyikan dulu). */
async function sampleBackdrop(row) {
  const el = await page.$(`[data-ct="${row.id}"]`);
  if (!el) return null;
  await el.evaluate((n) => n.scrollIntoView({ block: "center" }));
  await new Promise((r) => setTimeout(r, 120));
  await el.evaluate((n) => {
    n.dataset.prevColor = n.style.color;
    n.style.color = "transparent";
  });
  const box = await el.boundingBox();
  let png = null;
  if (box) {
    const buf = await page.screenshot({
      clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.max(2, box.width), height: Math.max(2, box.height) },
    });
    png = PNG.sync.read(Buffer.from(buf));
  }
  await el.evaluate((n) => {
    n.style.color = n.dataset.prevColor ?? "";
    delete n.dataset.prevColor;
  });
  if (!png) return null;
  let total = 0;
  const count = png.width * png.height;
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    total += 0.2126 * f(png.data[o]) + 0.7152 * f(png.data[o + 1]) + 0.0722 * f(png.data[o + 2]);
  }
  return total / count;
}

for (const url of PAGES) {
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 500));
  const before = await page.evaluate(probe);
  for (const row of before) {
    let contrast = row.contrast;
    if (row.media) {
      const bgLum = await sampleBackdrop(row);
      if (bgLum === null) continue;
      contrast = +((Math.max(row.fgLum, bgLum) + 0.05) / (Math.min(row.fgLum, bgLum) + 0.05)).toFixed(2);
    }
    if (contrast < (row.large ? 3 : 4.5)) {
      issues.push({ url, state: "normal", ...row, contrast, bg: row.bg ?? "media" });
    }
  }

  const targets = await page.$$("a[href], button:not([disabled])");
  let i = 0;
  for (const t of targets) {
    if (i++ > 60) break;
    const ok = await t.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 4 && r.height > 4 && r.top > -50 && r.top < 5000;
    });
    if (!ok) continue;
    const label = await t.evaluate((el) => (el.textContent || "").trim().slice(0, 40));
    try {
      await t.hover();
    } catch {
      continue;
    }
    await new Promise((r) => setTimeout(r, 220));
    const after = await t.evaluate((el) => {
      function parse(c) {
        const m = c.match(/rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\)/);
        if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
        if (!c || c === "transparent" || c === "none") return null;
        try {
          const cv = document.createElement("canvas");
          cv.width = cv.height = 1;
          const ctx = cv.getContext("2d");
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = c;
          ctx.fillRect(0, 0, 1, 1);
          const d = ctx.getImageData(0, 0, 1, 1).data;
          if (!d[3]) return null;
          return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
        } catch {
          return null;
        }
      }
      function lum({ r, g, b }) {
        const f = (v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      }
      function ratio(a, b) {
        const l1 = lum(a);
        const l2 = lum(b);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }
      function solidBg(node) {
        let n = node;
        while (n && n !== document.documentElement) {
          const s = getComputedStyle(n);
          if (s.backgroundImage !== "none") return null;
          const bg = parse(s.backgroundColor);
          if (bg && bg.a > 0.85) return bg;
          n = n.parentElement;
        }
        return parse(getComputedStyle(document.body).backgroundColor) ?? { r: 255, g: 255, b: 255, a: 1 };
      }
      const s = getComputedStyle(el);
      const fg = parse(s.color);
      const bg = solidBg(el);
      if (!fg || !bg) return null;
      return { fg: s.color, contrast: +ratio(fg, bg).toFixed(2), bgcolor: s.backgroundColor, size: parseFloat(s.fontSize), bold: +s.fontWeight >= 600 };
    });
    if (!after) continue;
    const large = after.size >= 24 || (after.size >= 18.66 && after.bold);
    if (after.contrast < (large ? 3 : 4.5)) {
      issues.push({ url, state: "hover", text: label, tag: await t.evaluate((el) => el.tagName), fg: after.fg, bg: after.bgcolor, contrast: after.contrast, size: after.size, large });
    }
    await page.mouse.move(0, 0);
  }
}

await browser.close();
const seen = new Set();
const unique = issues.filter((x) => {
  const k = `${x.url}|${x.text}|${x.state}|${x.contrast}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});
console.log(`kontras gagal: ${unique.length}`);
for (const x of unique.slice(0, 40)) {
  console.log(`${x.state.padEnd(6)} ${x.contrast} r=${x.url} <${x.tag}> "${x.text}" fg=${x.fg} bg=${x.bg}`);
}
process.exitCode = unique.length ? 1 : 0;

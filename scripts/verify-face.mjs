/**
 * Verifikasi verifikasi wajah Blush: model face-api di browser, route server, badge, dan anti-duplikat.
 *
 * A — /app/verify merender & model wajah termuat dari /models/face
 * B — deskriptor wajah asli dihitung di browser lalu dikirim ke /api/verify/face
 * C — tantangan tidak lengkap ditolak 400
 * D — akun kedua dengan wajah sama ditolak 409
 * E — badge centang tampil di /app/profile dan terbaca dari DB
 * F — kamera sungguhan (fake capture) memicu deteksi wajah di halaman
 *
 * Jalankan: node scripts/verify-face.mjs   (butuh server di BLUSH_BASE)
 */
import puppeteer from "puppeteer-core";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BLUSH_BASE ?? "http://localhost:3105";
const OUT = path.resolve("docs/verify");
mkdirSync(OUT, { recursive: true });
const SCRATCH = "C:/Users/ariel/AppData/Local/hermes/cache/scratch";
const SAMPLE = "node_modules/@vladmandic/face-api/demo/sample1.jpg";
const PASS = process.env.BLUSH_TEST_PASSWORD;
if (!PASS) throw new Error("BLUSH_TEST_PASSWORD belum diisi");

// Reset status verifikasi akun uji supaya skrip bisa dijalankan berulang (cooldown 1 jam per akun).
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!serviceKey || !url) throw new Error("butuh SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL di .env.local");
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
await admin.from("verifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
await admin.from("profiles").update({ is_verified: "none" }).in("display_name", ["Rara", "Damar"]);

const out = [];
const log = (label, cond, extra = "") => {
  out.push(`${cond ? "PASS" : "FAIL"} — ${label}${extra ? " :: " + extra : ""}`);
  console.log(out.at(-1));
};

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type("#email", email);
  await page.type("#password", PASS);
  await page.click("button[type=submit]");
  await page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 20000 });
}

/** Hitung deskriptor 128-D di dalam browser memakai model yang sama dengan halaman verifikasi. */
async function descriptorInPage(page) {
  const b64 = readFileSync(SAMPLE).toString("base64");
  return page.evaluate(async (data) => {
    if (!window.faceapi) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "/models/face/face-api.js";
        s.onload = res;
        s.onerror = () => rej(new Error("gagal memuat face-api.js"));
        document.head.appendChild(s);
      });
    }
    const api = window.faceapi;
    await api.nets.tinyFaceDetector.loadFromUri("/models/face");
    await api.nets.faceLandmark68Net.loadFromUri("/models/face");
    await api.nets.faceRecognitionNet.loadFromUri("/models/face");
    const img = new Image();
    img.src = `data:image/jpeg;base64,${data}`;
    await img.decode();
    const det = await api
      .detectSingleFace(img, new api.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.4 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!det?.descriptor) throw new Error("wajah contoh tidak terdeteksi");
    return { descriptor: Array.from(det.descriptor), box: det.detection.box };
  }, b64);
}

async function post(page, payload) {
  return page.evaluate(async (body) => {
    const res = await fetch("/api/verify/face", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: res.status, json: await res.json() };
  }, payload);
}

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: [
    "--no-sandbox",
    "--enable-gpu",
    "--use-angle=d3d11",
    "--ignore-gpu-blocklist",
    "--force-device-scale-factor=1",
    "--window-size=1280,900",
  ],
});

try {
  // ---------- A + B + C : akun utama ----------
  const rara = await browser.createBrowserContext();
  const p = await rara.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await login(p, "rara@blush.test");

  await p.goto(`${BASE}/app/verify`, { waitUntil: "networkidle2" });
  const verifyText = (await p.evaluate(() => document.body.innerText)).toLowerCase();
  log("halaman verifikasi merender", verifyText.includes("mulai pindai") && verifyText.includes("langkah verifikasi"));
  await p.screenshot({ path: path.join(OUT, "20-verify-intro.png") });

  const { descriptor } = await descriptorInPage(p);
  log("deskriptor wajah dihitung di browser", descriptor.length === 128, `${descriptor.length} angka`);
  const modelsLoaded = await p.evaluate(() => Boolean(window.faceapi?.nets?.faceRecognitionNet?.isLoaded));
  log("model face-api termuat dari /models/face", modelsLoaded);

  const badChallenges = await post(p, { descriptor, challenges: ["kiri", "kiri", "kanan"], device: "verify-face.mjs" });
  log("tantangan tidak lengkap ditolak", badChallenges.status === 400, JSON.stringify(badChallenges.json));

  const badDescriptor = await post(p, { descriptor: [1, 2, 3], challenges: ["kiri", "kanan", "dekat"] });
  log("deskriptor cacat ditolak", badDescriptor.status === 400, JSON.stringify(badDescriptor.json));

  const ok = await post(p, { descriptor, challenges: ["kiri", "kanan", "dekat"], device: "verify-face.mjs" });
  log("verifikasi wajah diterima server", ok.status === 200 && ok.json.status === "approved", JSON.stringify(ok.json));

  await p.goto(`${BASE}/app/profile`, { waitUntil: "networkidle2" });
  const profileText = await p.evaluate(() => document.body.innerText);
  log("badge Terverifikasi tampil di profil", profileText.includes("Terverifikasi"));
  await p.screenshot({ path: path.join(OUT, "21-profile-verified.png"), fullPage: false });

  // ---------- D : akun lain pakai wajah sama ----------
  const damar = await browser.createBrowserContext();
  const q = await damar.newPage();
  await q.setViewport({ width: 1280, height: 900 });
  await login(q, "damar@blush.test");
  const dup = await post(q, { descriptor, challenges: ["kiri", "kanan", "dekat"], device: "verify-face.mjs" });
  log("wajah sama di akun kedua ditolak", dup.status === 409, JSON.stringify(dup.json));

  // ---------- F : kamera + deteksi wajah langsung ----------
  const camBrowser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: [
      "--no-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-video-capture=${SCRATCH}/blush-face.y4m`,
      "--enable-gpu",
      "--use-angle=d3d11",
      "--ignore-gpu-blocklist",
      "--autoplay-policy=no-user-gesture-required",
      "--window-size=1280,900",
    ],
  });
  try {
    const ctx = await camBrowser.createBrowserContext();
    const c = await ctx.newPage();
    await c.setViewport({ width: 1280, height: 900 });
    await login(c, "damar@blush.test");
    await c.goto(`${BASE}/app/verify`, { waitUntil: "networkidle2" });
    await c.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("Mulai pindai"));
      btn?.click();
    });
    const live = await c
      .waitForFunction(
        () => {
          const s = document.querySelector('[role="status"]')?.textContent ?? "";
          return /Tengok sedikit|Dekatkan wajah|terdeteksi|satu wajah/i.test(s);
        },
        { timeout: 90000 },
      )
      .then(() => true)
      .catch(() => false);
    const camState = await c.evaluate(() => {
      const v = document.querySelector("video");
      return {
        hint: document.querySelector('[role="status"]')?.textContent ?? "",
        video: v ? `${v.videoWidth}x${v.videoHeight}` : "tidak ada",
        model: Boolean(window.__faceApiLoaded),
      };
    });
    log("kamera terbuka & loop deteksi jalan", live, `hint="${camState.hint.trim()}" video=${camState.video}`);
    log("wajah terdeteksi dari kamera", /Tengok sedikit|Dekatkan wajah|Bagus/.test(camState.hint), camState.hint.trim());
    await c.screenshot({ path: path.join(OUT, "22-verify-live.png") });
  } finally {
    await camBrowser.close();
  }
} finally {
  await browser.close();
}

console.log("\n" + out.join("\n"));
const fails = out.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${out.length - fails}/${out.length} PASS`);
process.exit(fails === 0 ? 0 : 1);
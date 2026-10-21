import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

const ALLOWED_CHALLENGES = new Set(["kiri", "kanan", "dekat"]);
const MAX_DESC_DISTANCE = 0.52; // ambang euclidean: < 0.52 dianggap wajah yang sama
const ATTEMPT_COOLDOWN_MS = 60 * 60 * 1000;

function euclidean(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Verifikasi wajah otomatis.
 * Klien menjalankan model deteksi/landmark/recognition di perangkat, menyelesaikan
 * tantangan gerak (kiri, kanan, dekat), lalu mengirim deskriptor 128 angka.
 * Server menolak wajah yang sudah dipakai akun lain dan langsung memberi badge.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  let body: {
    descriptor?: unknown;
    challenges?: unknown;
    selfie?: unknown;
    device?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON." }, { status: 400 });
  }

  const descriptor = Array.isArray(body.descriptor) ? body.descriptor.map(Number) : null;
  if (!descriptor || descriptor.length !== 128 || descriptor.some((v) => !Number.isFinite(v))) {
    return NextResponse.json({ error: "Deskriptor wajah tidak valid." }, { status: 400 });
  }

  const challenges = Array.isArray(body.challenges) ? body.challenges.map(String) : [];
  const unique = new Set(challenges);
  if (challenges.length < 3 || unique.size < 3 || [...unique].some((c) => !ALLOWED_CHALLENGES.has(c))) {
    return NextResponse.json({ error: "Tantangan liveness tidak lengkap." }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: profile } = await admin
    .from("profiles")
    .select("is_verified")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_verified === "approved") {
    return NextResponse.json({ ok: true, status: "approved", already: true });
  }

  // Batasi percobaan: satu per jam supaya tidak jadi alat probing.
  const { data: recent } = await admin
    .from("verifications")
    .select("created_at")
    .eq("profile_id", user.id)
    .gte("created_at", new Date(Date.now() - ATTEMPT_COOLDOWN_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(1);
  if (recent && recent.length > 0) {
    return NextResponse.json(
      { error: "Kamu sudah mencoba dalam satu jam terakhir. Coba lagi nanti." },
      { status: 429 },
    );
  }

  // Wajah yang sama tidak boleh dipakai dua akun (anti profil ganda / bot).
  const { data: approved } = await admin
    .from("verifications")
    .select("profile_id, face_descriptor")
    .eq("status", "approved")
    .not("face_descriptor", "is", null);

  let best = Number.POSITIVE_INFINITY;
  for (const row of approved ?? []) {
    const other = Array.isArray(row.face_descriptor) ? (row.face_descriptor as number[]) : null;
    if (!other || other.length !== 128) continue;
    const d = euclidean(descriptor, other);
    if (d < best) best = d;
    if (d < MAX_DESC_DISTANCE) {
      return NextResponse.json(
        { error: "Wajah ini sudah terdaftar di akun lain. Satu wajah hanya untuk satu akun." },
        { status: 409 },
      );
    }
  }

  // Simpan satu bingkai sebagai bukti audit (bucket privat, hanya admin).
  let selfiePath: string | null = null;
  if (typeof body.selfie === "string" && body.selfie.startsWith("data:image/")) {
    const comma = body.selfie.indexOf(",");
    const meta = body.selfie.slice(5, comma);
    const ext = meta.includes("png") ? "png" : "jpg";
    const buf = Buffer.from(body.selfie.slice(comma + 1), "base64");
    if (buf.byteLength > 0 && buf.byteLength <= 4 * 1024 * 1024) {
      const path = `${user.id}/face-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await admin.storage
        .from("verifications")
        .upload(path, buf, { contentType: meta.split(";")[0] });
      if (!upErr) selfiePath = path;
    }
  }

  const { error: insErr } = await admin.from("verifications").insert({
    profile_id: user.id,
    selfie_path: selfiePath,
    challenge: challenges.join(","),
    liveness_passed: true,
    similarity: Number.isFinite(best) ? Number(Math.max(0, 1 - best).toFixed(4)) : null,
    status: "approved",
    reviewed_at: new Date().toISOString(),
    face_descriptor: descriptor,
    device: typeof body.device === "string" ? body.device.slice(0, 120) : null,
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const { error: updErr } = await admin.from("profiles").update({ is_verified: "approved" }).eq("id", user.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: "approved" });
}

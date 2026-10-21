"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { photoUrl } from "@/lib/photo";
import { btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

type Interest = { id: number; slug: string; label: string };
type Photo = { id: string; storage_path: string; position: number };

export default function ProfileForm({
  userId,
  profile,
  photos,
  interests,
  pickedInterests,
  preferences,
}: {
  userId: string;
  profile: {
    display_name: string;
    birthdate: string | null;
    gender: "woman" | "man" | "nonbinary" | null;
    bio: string;
    job: string;
    city: string;
    intent: "relationship" | "dating" | "friends";
    is_verified: "none" | "pending" | "approved" | "rejected";
  };
  photos: Photo[];
  interests: Interest[];
  pickedInterests: number[];
  preferences: { min_age: number; max_age: number; max_distance_km: number; show_gender: string[] };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio);
  const [job, setJob] = useState(profile.job);
  const [city, setCity] = useState(profile.city);
  const [intent, setIntent] = useState(profile.intent);
  const [picked, setPicked] = useState<number[]>(pickedInterests);
  const [minAge, setMinAge] = useState(preferences.min_age);
  const [maxAge, setMaxAge] = useState(preferences.max_age);
  const [maxDistance, setMaxDistance] = useState(preferences.max_distance_km);
  const [showGender, setShowGender] = useState<string[]>(preferences.show_gender);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    setStatus(null);
    const { error: profErr } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim(), bio, job, city, intent, last_active_at: new Date().toISOString() })
      .eq("id", userId);
    if (profErr) {
      setBusy(false);
      setError(profErr.message);
      return;
    }
    const { error: prefErr } = await supabase.from("preferences").upsert({
      user_id: userId,
      min_age: minAge,
      max_age: maxAge,
      max_distance_km: maxDistance,
      show_gender: showGender,
      intent: null,
    });
    if (prefErr) {
      setBusy(false);
      setError(prefErr.message);
      return;
    }
    await supabase.from("profile_interests").delete().eq("profile_id", userId);
    if (picked.length) {
      await supabase.from("profile_interests").insert(picked.map((id) => ({ profile_id: userId, interest_id: id })));
    }
    setBusy(false);
    setStatus("Profil tersimpan.");
    router.refresh();
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const startPos = photos.length;
    const list = Array.from(files).slice(0, Math.max(0, 6 - startPos));
    for (const [i, file] of list.entries()) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, file);
      if (upErr) {
        setError(upErr.message);
        break;
      }
      await supabase.from("photos").insert({ profile_id: userId, storage_path: path, position: startPos + i });
    }
    setUploading(false);
    router.refresh();
  }

  async function removePhoto(photo: Photo) {
    setBusy(true);
    await supabase.storage.from("photos").remove([photo.storage_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    setBusy(false);
    router.refresh();
  }

  async function submitVerification(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    const form = new FormData();
    form.append("selfie", file);
    const res = await fetch("/api/verify/submit", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Gagal mengirim verifikasi.");
      return;
    }
    setStatus("Selfie terkirim. Status verifikasi: menunggu review.");
    router.refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-[var(--space-lg)]">
      <section className="rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Foto</h2>
        <p className="mt-1 text-sm text-ink-soft">Maksimal 6 foto. Foto pertama yang tampil di deck.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((p) => {
            const url = photoUrl(p.storage_path);
            return (
              <div key={p.id} className="w-28">
                <div className="h-28 w-28 overflow-hidden rounded-[8px] bg-blush-tint">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="Foto profil" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <button type="button" className="mt-1 text-xs font-semibold text-blush-deep" onClick={() => removePhoto(p)} disabled={busy}>
                  Hapus
                </button>
              </div>
            );
          })}
          {photos.length < 6 ? (
            <label className="flex h-28 w-28 cursor-pointer items-center justify-center rounded-[8px] border border-dashed border-line-strong text-xs font-semibold text-ink-soft">
              {uploading ? "Mengunggah…" : "+ Tambah"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
            </label>
          ) : null}
        </div>
      </section>

      <section className="rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Tentang kamu</h2>
        <div className="mt-[var(--space-sm)] grid gap-[var(--space-sm)] sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="display_name">
              Nama panggilan
            </label>
            <input id="display_name" className={inputBase} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="job">
              Pekerjaan
            </label>
            <input id="job" className={inputBase} value={job} onChange={(e) => setJob(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="city">
              Kota
            </label>
            <input id="city" className={inputBase} value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="intent">
              Niat
            </label>
            <select id="intent" className={inputBase} value={intent} onChange={(e) => setIntent(e.target.value as typeof intent)}>
              <option value="relationship">Hubungan serius</option>
              <option value="dating">Kencan</option>
              <option value="friends">Cari teman</option>
            </select>
          </div>
        </div>
        <div className="mt-[var(--space-sm)]">
          <label className={label} htmlFor="bio">
            Bio
          </label>
          <textarea id="bio" rows={3} className={inputBase} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} />
        </div>
      </section>

      <section className="rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Minat</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {interests.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() =>
                setPicked((prev) => (prev.includes(it.id) ? prev.filter((p) => p !== it.id) : prev.length >= 8 ? prev : [...prev, it.id]))
              }
              className={`rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                picked.includes(it.id) ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line text-ink-soft"
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Preferensi</h2>
        <div className="mt-[var(--space-sm)] grid gap-[var(--space-sm)] sm:grid-cols-3">
          <div>
            <label className={label} htmlFor="minAge">
              Umur min
            </label>
            <input id="minAge" type="number" min={18} max={99} className={inputBase} value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} />
          </div>
          <div>
            <label className={label} htmlFor="maxAge">
              Umur maks
            </label>
            <input id="maxAge" type="number" min={18} max={99} className={inputBase} value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} />
          </div>
          <div>
            <label className={label} htmlFor="dist">
              Jarak: {maxDistance} km
            </label>
            <input id="dist" type="range" min={1} max={200} value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} className="w-full" />
          </div>
        </div>
        <div className="mt-[var(--space-sm)]">
          <span className={label}>Tampilkan gender</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {[
              { id: "woman", t: "Perempuan" },
              { id: "man", t: "Laki-laki" },
              { id: "nonbinary", t: "Non-biner" },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setShowGender((prev) => (prev.includes(g.id) ? prev.filter((p) => p !== g.id) : [...prev, g.id]))}
                className={`rounded-[999px] border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                  showGender.includes(g.id) ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                }`}
              >
                {g.t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Verifikasi foto</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Status:{" "}
          <strong>
            {profile.is_verified === "approved"
              ? "terverifikasi"
              : profile.is_verified === "pending"
                ? "menunggu review"
                : profile.is_verified === "rejected"
                  ? "ditolak — kirim ulang"
                  : "belum dikirim"}
          </strong>
          . Ambil selfie tanpa penutup wajah, lalu kirim. Foto verifikasi tidak pernah tampil di profil.
        </p>
        <label className={`${btnGhost} mt-3 cursor-pointer`}>
          Kirim selfie verifikasi
          <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => submitVerification(e.target.files)} />
        </label>
      </section>

      {status ? <p className="text-sm font-medium text-ok">{status}</p> : null}
      {error ? <p className="text-sm font-medium text-blush-deep">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan perubahan"}
        </button>
        <button type="button" className={btnGhost} onClick={signOut}>
          Keluar
        </button>
      </div>
    </div>
  );
}

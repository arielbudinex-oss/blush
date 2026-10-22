"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { photoUrl } from "@/lib/photo";
import { Icon } from "@/components/Icon";
import { btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

type Interest = { id: number; slug: string; label: string };
type Photo = { id: string; storage_path: string; position: number; caption: string | null };
type Prompt = { id: number; text: string; category: string };
type MyPrompt = { prompt_id: number; answer: string; position: number };

const EXERCISE = ["Tidak pernah", "Jarang", "Kadang", "Sering", "Tiap hari"];
const DRINKING = ["Tidak minum", "Sesekali", "Sosial", "Sering"];
const SMOKING = ["Tidak merokok", "Kadang", "Sering", "Sudah berhenti"];
const PETS = ["Tidak punya", "Anjing", "Kucing", "Ikan", "Burung", "Lainnya"];
const ZODIAC = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const EDUCATION = ["SMA/SMK", "D3", "S1", "S2", "S3", "Lainnya"];

export default function ProfileForm({
  userId,
  profile,
  photos,
  interests,
  pickedInterests,
  preferences,
  prompts,
  myPrompts,
}: {
  userId: string;
  profile: {
    display_name: string;
    bio: string;
    job: string;
    city: string;
    intent: "relationship" | "dating" | "friends";
    is_verified: "none" | "pending" | "approved" | "rejected";
    height_cm: number | null;
    exercise: string | null;
    drinking: string | null;
    smoking: string | null;
    pets: string | null;
    zodiac: string | null;
    education: string | null;
    languages: string[];
    hometown: string | null;
  };
  photos: Photo[];
  interests: Interest[];
  pickedInterests: number[];
  preferences: { min_age: number; max_age: number; max_distance_km: number; show_gender: string[] };
  prompts: Prompt[];
  myPrompts: MyPrompt[];
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

  const [height, setHeight] = useState<string>(profile.height_cm ? String(profile.height_cm) : "");
  const [exercise, setExercise] = useState(profile.exercise ?? "");
  const [drinking, setDrinking] = useState(profile.drinking ?? "");
  const [smoking, setSmoking] = useState(profile.smoking ?? "");
  const [pets, setPets] = useState(profile.pets ?? "");
  const [zodiac, setZodiac] = useState(profile.zodiac ?? "");
  const [education, setEducation] = useState(profile.education ?? "");
  const [languages, setLanguages] = useState((profile.languages ?? []).join(", "));
  const [hometown, setHometown] = useState(profile.hometown ?? "");

  const [slots, setSlots] = useState<{ promptId: number | null; answer: string }[]>(() => {
    const base = [...myPrompts].sort((a, b) => a.position - b.position).slice(0, 3);
    return [0, 1, 2].map((i) => ({ promptId: base[i]?.prompt_id ?? null, answer: base[i]?.answer ?? "" }));
  });
  const [captions, setCaptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(photos.map((p) => [p.id, p.caption ?? ""])),
  );

  const [status, setStatus] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const usedPromptIds = slots.map((s) => s.promptId).filter(Boolean) as number[];

  async function save() {
    setBusy(true);
    setError(null);
    setStatus(null);
    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        bio,
        job,
        city,
        intent,
        height_cm: height ? Number(height) : null,
        exercise: exercise || null,
        drinking: drinking || null,
        smoking: smoking || null,
        pets: pets || null,
        zodiac: zodiac || null,
        education: education || null,
        languages: languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 6),
        hometown: hometown.trim() || null,
        last_active_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (profErr) {
      setBusy(false);
      setError(profErr.message);
      return;
    }

    const { error: prefErr } = await supabase.from("preferences").upsert({
      user_id: userId,
      min_age: Math.min(minAge, maxAge),
      max_age: Math.max(minAge, maxAge),
      max_distance_km: maxDistance,
      show_gender: showGender.length ? showGender : ["woman", "man"],
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

    await supabase.from("profile_prompts").delete().eq("profile_id", userId);
    const rows = slots
      .map((s, i) => ({ profile_id: userId, prompt_id: s.promptId, answer: s.answer.trim(), position: i }))
      .filter((r) => r.prompt_id && r.answer.length > 0);
    if (rows.length) {
      const { error: promptErr } = await supabase.from("profile_prompts").insert(rows);
      if (promptErr) {
        setBusy(false);
        setError(promptErr.message);
        return;
      }
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
      if (file.size > 8 * 1024 * 1024) {
        setError("Satu foto maksimal 8 MB.");
        break;
      }
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
    if (confirmDelete !== photo.id) {
      setConfirmDelete(photo.id);
      return;
    }
    setConfirmDelete(null);
    setBusy(true);
    await supabase.storage.from("photos").remove([photo.storage_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    setBusy(false);
    router.refresh();
  }

  async function makeCover(photo: Photo) {
    setBusy(true);
    const ordered = [photo, ...photos.filter((p) => p.id !== photo.id)];
    for (const [i, p] of ordered.entries()) {
      await supabase.from("photos").update({ position: i }).eq("id", p.id);
    }
    setBusy(false);
    router.refresh();
  }

  async function saveCaption(photo: Photo) {
    const caption = (captions[photo.id] ?? "").trim().slice(0, 120);
    if (caption === (photo.caption ?? "")) return;
    const { error: err } = await supabase.from("photos").update({ caption: caption || null }).eq("id", photo.id);
    if (err) return setError(err.message);
    setStatus("Caption foto disimpan.");
    router.refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login?bye=1");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-[var(--space-lg)]">
      <section className="rounded-card border border-line bg-paper p-[var(--space-md)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl">Foto</h2>
          <span className="text-2xs text-ink-faint">{photos.length} dari 6 foto · foto pertama jadi sampul</span>
        </div>
        <p className="mt-1 text-sm text-ink-soft">Tambah sampai 6 foto. Ketuk bintang untuk menjadikannya sampul. Keterangan foto muncul saat orang membuka profilmu.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => {
            const url = photoUrl(p.storage_path);
            return (
              <div key={p.id} className="overflow-hidden rounded-[10px] border border-line">
                <div className="relative aspect-square bg-paper-2">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  ) : null}
                  {i === 0 ? (
                    <span className="absolute left-2 top-2 rounded-[999px] bg-ink/85 px-2 py-0.5 text-2xs font-semibold text-paper backdrop-blur-sm">
                      Sampul
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeCover(p)}
                      disabled={busy}
                      aria-label="Jadikan foto sampul"
                      className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-[999px] bg-paper/90 text-blush-deep"
                    >
                      <Icon name="star" className="h-4 w-4" filled />
                    </button>
                  )}
                </div>
                <div className="p-2">
                  <input
                    aria-label={`Caption foto ${i + 1}`}
                    className={`${inputBase} text-xs`}
                    placeholder="Keterangan foto"
                    maxLength={120}
                    value={captions[p.id] ?? ""}
                    onChange={(e) => setCaptions((c) => ({ ...c, [p.id]: e.target.value }))}
                    onBlur={() => saveCaption(p)}
                  />
                  {confirmDelete === p.id ? (
                    <span className="mt-1 flex items-center gap-2 text-xs font-semibold">
                      <button type="button" className="text-blush-deep underline" onClick={() => removePhoto(p)} disabled={busy}>
                        Hapus sekarang
                      </button>
                      <button type="button" className="text-ink-soft" onClick={() => setConfirmDelete(null)}>
                        Batal
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-blush-deep"
                      onClick={() => removePhoto(p)}
                      disabled={busy}
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {photos.length < 6 ? (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-line-strong text-xs font-semibold text-ink">
              {uploading ? "Mengunggah…" : "+ Tambah foto"}
              <span className="text-2xs font-normal text-ink-soft">JPG/PNG maks 8 MB</span>
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
              Lagi cari
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
            Bio singkat
          </label>
          <textarea id="bio" rows={3} className={inputBase} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} />
        </div>
      </section>

      <section className="rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Prompts profil</h2>
        <p className="mt-1 text-sm text-ink-soft">Pilih sampai 3 pertanyaan. Jawaban singkat lebih sering dibalas daripada paragraf panjang.</p>
        <div className="mt-3 flex flex-col gap-3">
          {slots.map((slot, i) => (
            <div key={i} className="rounded-[10px] border border-line bg-paper-2 p-3">
              <label className={label} htmlFor={`prompt-${i}`}>
                Pertanyaan {i + 1}
              </label>
              <select
                id={`prompt-${i}`}
                className={inputBase}
                value={slot.promptId ?? ""}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  setSlots((s) => s.map((v, j) => (j === i ? { ...v, promptId: id } : v)));
                }}
              >
                <option value="">— kosong —</option>
                {prompts.map((p) => (
                  <option key={p.id} value={p.id} disabled={usedPromptIds.includes(p.id) && slot.promptId !== p.id}>
                    {p.text}
                  </option>
                ))}
              </select>
              <textarea
                aria-label={`Jawaban ${i + 1}`}
                rows={2}
                maxLength={300}
                className={`${inputBase} mt-2`}
                placeholder="Tulis jawaban singkat"
                value={slot.answer}
                onChange={(e) => setSlots((s) => s.map((v, j) => (j === i ? { ...v, answer: e.target.value } : v)))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Detail diri</h2>
        <div className="mt-[var(--space-sm)] grid gap-[var(--space-sm)] sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="height">
              Tinggi (cm)
            </label>
            <input
              id="height"
              type="number"
              min={100}
              max={230}
              className={inputBase}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="zodiac">
              Zodiak
            </label>
            <select id="zodiac" className={inputBase} value={zodiac} onChange={(e) => setZodiac(e.target.value)}>
              <option value="">—</option>
              {ZODIAC.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="exercise">
              Olahraga
            </label>
            <select id="exercise" className={inputBase} value={exercise} onChange={(e) => setExercise(e.target.value)}>
              <option value="">—</option>
              {EXERCISE.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="drinking">
              Alkohol
            </label>
            <select id="drinking" className={inputBase} value={drinking} onChange={(e) => setDrinking(e.target.value)}>
              <option value="">—</option>
              {DRINKING.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="smoking">
              Rokok
            </label>
            <select id="smoking" className={inputBase} value={smoking} onChange={(e) => setSmoking(e.target.value)}>
              <option value="">—</option>
              {SMOKING.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="pets">
              Hewan
            </label>
            <select id="pets" className={inputBase} value={pets} onChange={(e) => setPets(e.target.value)}>
              <option value="">—</option>
              {PETS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="education">
              Pendidikan
            </label>
            <select id="education" className={inputBase} value={education} onChange={(e) => setEducation(e.target.value)}>
              <option value="">—</option>
              {EDUCATION.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="hometown">
              Kota asal
            </label>
            <input id="hometown" className={inputBase} value={hometown} onChange={(e) => setHometown(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="languages">
              Bahasa (pisahkan dengan koma)
            </label>
            <input id="languages" className={inputBase} value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Indonesia, Inggris, Jawa" />
          </div>
        </div>
      </section>

      <section className="rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Minat</h2>
        <p className="mt-1 text-sm text-ink-soft">Pilih sampai 8. Makin lengkap, makin sering profilmu muncul di orang yang cocok.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {interests.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() =>
                setPicked((prev) =>
                  prev.includes(it.id) ? prev.filter((p) => p !== it.id) : prev.length >= 8 ? prev : [...prev, it.id],
                )
              }
              aria-pressed={picked.includes(it.id)}
              className={`inline-flex items-center gap-1 rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                picked.includes(it.id) ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line text-ink-soft"
              }`}
            >
              {picked.includes(it.id) ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.8} /> : null}
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
          <span className={label}>Gender yang ingin kamu lihat</span>
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
                aria-pressed={showGender.includes(g.id)}
                className={`inline-flex items-center gap-1 rounded-[999px] border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                  showGender.includes(g.id) ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                }`}
              >
                {showGender.includes(g.id) ? <Icon name="check" className="h-4 w-4" strokeWidth={2.8} /> : null}
                {g.t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-card border border-line bg-paper p-[var(--space-md)]">
        <h2 className="text-xl">Verifikasi wajah</h2>
        {profile.is_verified === "approved" ? (
          <p className="mt-2 text-sm text-ink-soft">
            Badge centang <strong className="text-ok">aktif</strong>. Wajahmu sudah terdaftar dan tampil di profil serta kartu deck.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-soft">
              Pindai wajah sekali lewat kamera. Tantangan gerak memastikan yang di depan kamera benar-benar manusia, dan satu
              wajah hanya boleh dipakai satu akun.
            </p>
            <Link href="/app/verify" className={`${btnPrimary} mt-3`}>
              Mulai verifikasi wajah
            </Link>
          </>
        )}
      </section>

      {status ? <p className="text-sm font-medium text-ok">{status}</p> : null}
      {error ? <p className="text-sm font-medium text-blush-deep">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan perubahan"}
        </button>
        <Link href="/app/settings" className={btnGhost}>
          Pengaturan
        </Link>
        <button type="button" className={btnGhost} onClick={signOut}>
          Keluar
        </button>
      </div>
    </div>
  );
}

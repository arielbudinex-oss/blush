"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnGhost, btnPrimary, inputBase, label } from "@/components/ui";
import { Icon } from "@/components/Icon";

type Interest = { id: number; slug: string; label: string };
type Gender = "woman" | "man" | "nonbinary";
type Intent = "relationship" | "dating" | "friends";

const GENDER_LABEL: Record<Gender, string> = { woman: "Perempuan", man: "Laki-laki", nonbinary: "Non-biner" };
const INTENT_LABEL: Record<Intent, string> = {
  relationship: "Cari hubungan serius",
  dating: "Cari kencan",
  friends: "Cari teman ngobrol",
};

export default function OnboardingForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);

  const [displayName, setDisplayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [intent, setIntent] = useState<Intent>("dating");
  const [city, setCity] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [minAge, setMinAge] = useState(20);
  const [maxAge, setMaxAge] = useState(38);
  const [maxDistance, setMaxDistance] = useState(50);
  const [showGender, setShowGender] = useState<Gender[]>(["woman", "man"]);

  useEffect(() => {
    supabase
      .from("interests")
      .select("id, slug, label")
      .order("label")
      .then(({ data }) => setInterests(data ?? []));
  }, [supabase]);

  // Kalau onboarding sempat terputus, lanjutkan dari data yang sudah tersimpan.
  useEffect(() => {
    (async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;
      const uid = authUser.id;
      const [{ data: profile }, { data: pref }, { data: mine }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, birthdate, gender, city, intent")
          .eq("id", uid)
          .maybeSingle(),
        supabase
          .from("preferences")
          .select("min_age, max_age, max_distance_km, show_gender")
          .eq("user_id", uid)
          .maybeSingle(),
        supabase.from("profile_interests").select("interest_id").eq("profile_id", uid),
      ]);

      if (profile?.display_name) setDisplayName((prev) => prev || profile.display_name);
      if (profile?.birthdate) setBirthdate((prev) => prev || profile.birthdate);
      if (profile?.gender) setGender((prev) => prev || profile.gender);
      if (profile?.city) setCity((prev) => prev || profile.city);
      if (profile?.intent) setIntent(profile.intent);
      if (pref) {
        setMinAge(pref.min_age);
        setMaxAge(pref.max_age);
        setMaxDistance(pref.max_distance_km);
        if (pref.show_gender?.length) setShowGender(pref.show_gender as Gender[]);
      }
      if (mine?.length) setPicked((prev) => prev.length ? prev : mine.map((r: { interest_id: number }) => r.interest_id));
    })();
  }, [supabase]);

  const age = birthdate ? Math.floor((Date.now() - new Date(birthdate).getTime()) / 31557600000) : null;

  function togglePicked(id: number) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : prev.length >= 8 ? prev : [...prev, id]));
  }

  function toggleShowGender(g: Gender) {
    setShowGender((prev) => (prev.includes(g) ? prev.filter((p) => p !== g) : [...prev, g]));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Browser nggak kasih izin lokasi. Isi kota dulu, jarak dihitung setelah lokasi tersedia.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Izin lokasi ditolak. Nggak apa-apa, lanjut saja; jarak muncul setelah lokasi diizinkan."),
      { timeout: 10000 },
    );
  }

  async function save() {
    setBusy(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesi habis. Masuk lagi ya.");
      setBusy(false);
      return;
    }
    if (age === null || age < 18) {
      setError("Blush hanya untuk 18 tahun ke atas.");
      setBusy(false);
      return;
    }
    if (picked.length < 3) {
      setError("Pilih minimal 3 minat dulu.");
      setBusy(false);
      return;
    }
    if (files.length < 1) {
      setError("Isi minimal satu foto.");
      setBusy(false);
      return;
    }

    const patch: Record<string, unknown> = {
      display_name: displayName.trim(),
      birthdate,
      gender,
      intent,
      city: city.trim(),
      onboarded_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };
    if (coords) patch.location = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;

    const { error: profErr } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (profErr) {
      setError(profErr.message);
      setBusy(false);
      return;
    }

    await supabase.from("preferences").upsert({
      user_id: user.id,
      min_age: minAge,
      max_age: maxAge,
      max_distance_km: maxDistance,
      show_gender: showGender,
      intent: null,
    });

    await supabase.from("profile_interests").delete().eq("profile_id", user.id);
    await supabase.from("profile_interests").insert(picked.map((id) => ({ profile_id: user.id, interest_id: id })));

    await supabase.from("photos").delete().eq("profile_id", user.id);
    for (const [index, file] of files.entries()) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, file, { upsert: false });
      if (upErr) {
        setError(`Upload foto gagal: ${upErr.message}`);
        setBusy(false);
        return;
      }
      await supabase.from("photos").insert({ profile_id: user.id, storage_path: path, position: index });
    }

    setBusy(false);
    router.push("/app/discover");
    router.refresh();
  }

  const steps = ["Tentang kamu", "Minatmu", "Foto", "Preferensi"];
  // Pratinjau lokal supaya orang tahu foto mana yang akan jadi sampul.
  const previews = useMemo(() => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-[var(--space-md)] px-[var(--space-md)] py-[var(--space-2xl)]">
      <div>
        <p className="text-xs font-semibold text-ink-soft">
          Langkah {step + 1} dari {steps.length}
        </p>
        <h1 className="mt-1 text-3xl">{steps[step]}</h1>
      </div>

      {step === 0 ? (
        <div className="flex flex-col gap-[var(--space-sm)]">
          <div>
            <label className={label} htmlFor="name">
              Nama panggilan
            </label>
            <input id="name" className={inputBase} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nama yang mau kamu pakai" />
            <p className="mt-1 text-xs text-ink-soft">Nama ini yang tampil di kartu dan chat.</p>
          </div>
          <div>
            <label className={label} htmlFor="bd">
              Tanggal lahir
            </label>
            <input id="bd" type="date" className={inputBase} value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
            {age !== null && age < 18 ? (
              <p className="mt-1 text-xs font-medium text-blush-deep">Blush untuk 18 tahun ke atas.</p>
            ) : null}
          </div>
          <div>
            <span className={label}>Gender</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  aria-pressed={gender === g}
                  className={`inline-flex items-center gap-1 rounded-[999px] border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    gender === g ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                  }`}
                >
                  {gender === g ? <Icon name="check" className="h-4 w-4" strokeWidth={2.8} /> : null}
                  {GENDER_LABEL[g]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={label} htmlFor="city">
              Kota
            </label>
            <input id="city" className={inputBase} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jakarta" />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-[var(--space-md)]">
          <div>
            <span className={label}>Lagi cari apa?</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {(Object.keys(INTENT_LABEL) as Intent[]).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIntent(i)}
                  aria-pressed={intent === i}
                  className={`inline-flex items-center gap-1 rounded-[999px] border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    intent === i ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                  }`}
                >
                  {intent === i ? <Icon name="check" className="h-4 w-4" strokeWidth={2.8} /> : null}
                  {INTENT_LABEL[i]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={label}>Minat · {picked.length} dari 8</span>
            <p className="mt-0.5 text-xs text-ink-soft">Pilih minimal 3. Yang kamu pilih dipakai untuk mencocokkan kartu.</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {interests.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => togglePicked(it.id)}
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
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-[var(--space-sm)]">
          <p className="text-sm text-ink-soft">
            Unggah 1 sampai 6 foto. Foto pertama jadi sampul. Pakai foto wajah yang jelas, bukan foto orang lain.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p, i) => (
              <div key={p.url} className="relative aspect-square overflow-hidden rounded-[10px] border border-line bg-paper-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Pratinjau foto ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 ? (
                  <span className="absolute left-1.5 top-1.5 rounded-[999px] bg-ink/85 px-2 py-0.5 text-2xs font-semibold text-paper">
                    Sampul
                  </span>
                ) : null}
              </div>
            ))}
            {files.length < 6 ? (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-line-strong text-xs font-semibold text-ink hover:bg-paper-2">
                {files.length === 0 ? "Pilih foto" : "Tambah foto"}
                <span className="text-2xs font-normal text-ink-soft">JPG atau PNG</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))}
                />
              </label>
            ) : null}
          </div>
          {files.length > 0 ? (
            <p className="text-xs text-ink-soft">
              {files.length} foto dipilih. Ukuran maksimal 8 MB per foto.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-[var(--space-sm)]">
          <div className="grid grid-cols-2 gap-[var(--space-sm)]">
            <div>
              <label className={label} htmlFor="minAge">
                Umur minimum
              </label>
              <input id="minAge" type="number" min={18} max={99} className={inputBase} value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} />
            </div>
            <div>
              <label className={label} htmlFor="maxAge">
                Umur maksimum
              </label>
              <input id="maxAge" type="number" min={18} max={99} className={inputBase} value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="dist">
              Jarak maksimum: {maxDistance} km
            </label>
            <input id="dist" type="range" min={1} max={200} value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <span className={label}>Gender yang ingin kamu lihat</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleShowGender(g)}
                  aria-pressed={showGender.includes(g)}
                  className={`inline-flex items-center gap-1 rounded-[999px] border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    showGender.includes(g) ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                  }`}
                >
                  {showGender.includes(g) ? <Icon name="check" className="h-4 w-4" strokeWidth={2.8} /> : null}
                  {GENDER_LABEL[g]}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className={btnGhost} onClick={useMyLocation}>
            {coords ? "Lokasi tersimpan. Pakai lokasi lain" : "Pakai lokasi saya sekarang"}
          </button>
          {coords ? (
            <p className="text-xs text-ink-faint">
              Koordinat dipakai hanya untuk menghitung jarak. Yang tampil ke orang lain hanya perkiraan jarak.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-blush-deep">{error}</p> : null}

      <div className="mt-auto flex items-center justify-between gap-[var(--space-sm)]">
        <button type="button" className={btnGhost} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Kembali
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setError(null);
              if (step === 0) {
                if (!displayName.trim()) return setError("Nama panggilan belum diisi.");
                if (!birthdate || (age ?? 0) < 18) return setError("Kamu harus 18 tahun ke atas.");
                if (!gender) return setError("Pilih gender dulu.");
              }
              setStep((s) => s + 1);
            }}
          >
            Lanjut
          </button>
        ) : (
          <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
            {busy ? "Menyimpan…" : "Selesai, lihat kartu"}
          </button>
        )}
      </div>
    </main>
  );
}

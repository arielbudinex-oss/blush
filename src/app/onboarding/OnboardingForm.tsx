"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

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

  // Nama dari Google sudah tersimpan di profil, jadi form tidak mulai kosong.
  useEffect(() => {
    supabase.auth.getUser().then(({ data: auth }) => {
      const uid = auth.user?.id;
      if (!uid) return;
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", uid)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.display_name) setDisplayName((prev) => prev || data.display_name);
        });
    });
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
            <input id="name" className={inputBase} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
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
                  className={`rounded-[999px] border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    gender === g ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                  }`}
                >
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
            <span className={label}>Kamu di sini untuk</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {(Object.keys(INTENT_LABEL) as Intent[]).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIntent(i)}
                  className={`rounded-[999px] border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    intent === i ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                  }`}
                >
                  {INTENT_LABEL[i]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={label}>Minat (pilih 3–8)</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {interests.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => togglePicked(it.id)}
                  className={`rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                    picked.includes(it.id) ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line text-ink-soft"
                  }`}
                >
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
            Unggah 1–6 foto. Foto pertama jadi foto utama. Jangan pakai foto orang lain. Akun bisa dibatasi.
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            className={inputBase}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))}
          />
          <ul className="text-sm text-ink-soft">
            {files.map((f) => (
              <li key={f.name}>
                {f.name} — {(f.size / 1024 / 1024).toFixed(1)} MB
              </li>
            ))}
          </ul>
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
            <span className={label}>Tampilkan</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleShowGender(g)}
                  className={`rounded-[999px] border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    showGender.includes(g) ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                  }`}
                >
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
            {busy ? "Menyimpan…" : "Selesai, mulai geser"}
          </button>
        )}
      </div>
    </main>
  );
}

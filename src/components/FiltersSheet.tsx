"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "@/components/motion";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { btnGhost, btnPrimary } from "@/components/ui";

type Prefs = {
  min_age: number;
  max_age: number;
  max_distance_km: number;
  show_gender: string[];
  verified_only: boolean;
  search_lat: number | null;
  search_lng: number | null;
};

const CITIES = [
  { name: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { name: "Bandung", lat: -6.9175, lng: 107.6191 },
  { name: "Surabaya", lat: -7.2575, lng: 112.7521 },
  { name: "Yogyakarta", lat: -7.7956, lng: 110.3695 },
  { name: "Denpasar", lat: -8.6705, lng: 115.2126 },
  { name: "Medan", lat: 3.5952, lng: 98.6722 },
  { name: "Makassar", lat: -5.1477, lng: 119.4327 },
  { name: "Balikpapan", lat: -1.2379, lng: 116.8529 },
];

const GENDERS = [
  { id: "woman", label: "Perempuan" },
  { id: "man", label: "Laki-laki" },
  { id: "nonbinary", label: "Non-biner" },
];

export default function FiltersSheet({
  open,
  prefs,
  gold,
  onClose,
}: {
  open: boolean;
  prefs: Prefs;
  gold: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const supabase = createClient();
  const [minAge, setMinAge] = useState(prefs.min_age);
  const [maxAge, setMaxAge] = useState(prefs.max_age);
  const [distance, setDistance] = useState(prefs.max_distance_km);
  const [genders, setGenders] = useState<string[]>(prefs.show_gender);
  const [verifiedOnly, setVerifiedOnly] = useState(prefs.verified_only);
  const [city, setCity] = useState<string | null>(
    prefs.search_lat !== null && prefs.search_lng !== null
      ? CITIES.find((c) => Math.abs(c.lat - (prefs.search_lat ?? 0)) < 0.05)?.name ?? null
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMinAge(prefs.min_age);
    setMaxAge(prefs.max_age);
    setDistance(prefs.max_distance_km);
    setGenders(prefs.show_gender);
    setVerifiedOnly(prefs.verified_only);
    setCity(
      prefs.search_lat !== null && prefs.search_lng !== null
        ? CITIES.find((c) => Math.abs(c.lat - (prefs.search_lat ?? 0)) < 0.05)?.name ?? null
        : null,
    );
    setError(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prefs, onClose]);

  async function save() {
    if (!genders.length) {
      setError("Pilih minimal satu gender.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase
      .from("preferences")
      .update({
        min_age: Math.min(minAge, maxAge),
        max_age: Math.max(minAge, maxAge),
        max_distance_km: distance,
        show_gender: genders,
        verified_only: verifiedOnly,
        search_lat: city ? CITIES.find((c) => c.name === city)?.lat ?? null : null,
        search_lng: city ? CITIES.find((c) => c.name === city)?.lng ?? null : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "");
    setBusy(false);
    if (err) {
      setError("Filter belum tersimpan. Coba lagi.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 sm:items-center sm:p-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Filter pencarian"
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-t-[22px] bg-paper sm:rounded-[22px]"
            initial={reduce ? false : { y: 40 }}
            animate={{ y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: 30 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <p className="font-display text-lg font-bold leading-tight">Filter</p>
                <p className="text-xs text-ink-soft">Siapa yang muncul di deck kamu.</p>
              </div>
              <button
                type="button"
                aria-label="Tutup filter"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full border border-line-strong text-ink hover:bg-paper-2"
              >
                <Icon name="x" className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-4 py-4">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-ink">Umur</span>
                  <span className="text-sm font-bold tabular-nums text-ink">
                    {minAge} sampai {maxAge}
                  </span>
                </div>
                <label className="mt-2 block text-xs text-ink-soft" htmlFor="min-age">
                  Minimum
                </label>
                <input
                  id="min-age"
                  type="range"
                  min={18}
                  max={80}
                  value={minAge}
                  onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge))}
                  className="mt-1 h-6 w-full accent-[var(--blush-deep)]"
                />
                <label className="mt-1 block text-xs text-ink-soft" htmlFor="max-age">
                  Maksimum
                </label>
                <input
                  id="max-age"
                  type="range"
                  min={18}
                  max={80}
                  value={maxAge}
                  onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge))}
                  className="mt-1 h-6 w-full accent-[var(--blush-deep)]"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-semibold text-ink" htmlFor="distance">
                    Jarak
                  </label>
                  <span className="text-sm font-bold tabular-nums text-ink">{distance} km</span>
                </div>
                <input
                  id="distance"
                  type="range"
                  min={1}
                  max={200}
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="mt-2 h-6 w-full accent-[var(--blush-deep)]"
                />
              </div>

              <div>
                <span className="text-sm font-semibold text-ink">Tampilkan</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GENDERS.map((g) => {
                    const active = genders.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setGenders((prev) => (active ? prev.filter((x) => x !== g.id) : [...prev, g.id]))}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                          active ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                        }`}
                      >
                        {active ? <Icon name="check" className="h-4 w-4" strokeWidth={2.8} /> : null}
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={verifiedOnly}
                aria-disabled={!gold}
                onClick={() => {
                  if (!gold) return;
                  setVerifiedOnly((v) => !v);
                }}
                className={`flex items-center justify-between rounded-[12px] border px-3 py-3 text-left transition-colors ${
                  verifiedOnly ? "border-verify bg-verify/5" : "border-line bg-paper"
                } ${gold ? "" : "opacity-60"}`}
              >
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    Hanya profil terverifikasi
                    {gold ? null : <span className="ml-1.5 rounded-full bg-blush-tint px-1.5 py-0.5 text-2xs font-semibold text-blush-deep">Gold</span>}
                  </span>
                  <span className="block text-xs text-ink-soft">
                    {gold ? "Centang biru sudah dicek lewat kamera." : "Naikkan paket Gold untuk memakai saringan ini."}
                  </span>
                </span>
                <span
                  className={`relative ml-3 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    verifiedOnly ? "bg-verify" : "bg-line-strong"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`absolute h-5 w-5 rounded-full bg-paper shadow transition-transform ${
                      verifiedOnly ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>

              {gold ? (
                <div>
                  <span className="text-sm font-semibold text-ink">Jelajah kota</span>
                  <p className="mt-0.5 text-xs text-ink-soft">Khusus Gold. Deck diisi orang dari kota yang dipilih.</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      aria-pressed={city === null}
                      onClick={() => setCity(null)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        city === null ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                      }`}
                    >
                      Lokasi saya
                    </button>
                    {CITIES.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        aria-pressed={city === c.name}
                        onClick={() => setCity(c.name)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          city === c.name ? "border-blush-deep bg-blush-tint text-blush-deep" : "border-line-strong text-ink-soft"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <a
                  href="/app/premium"
                  className="flex items-center justify-between rounded-[12px] border border-line bg-paper-2 px-3 py-3 text-sm"
                >
                  <span>
                    <span className="block font-semibold text-ink">Jelajah kota lain</span>
                    <span className="block text-xs text-ink-soft">Tersedia di Blush Gold.</span>
                  </span>
                  <Icon name="chevron" className="h-4 w-4 text-ink-soft" />
                </a>
              )}

              {error ? <p className="text-sm font-semibold text-blush-deep">{error}</p> : null}
            </div>

            <div className="flex gap-2 border-t border-line px-4 py-3">
              <button type="button" className={btnGhost} onClick={onClose}>
                Batal
              </button>
              <button type="button" className={`${btnPrimary} flex-1`} onClick={save} disabled={busy}>
                {busy ? "Menyimpan…" : "Terapkan filter"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

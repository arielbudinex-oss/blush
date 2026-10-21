import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { PLANS, type Plan } from "@/lib/plans";
import { photoUrl } from "@/lib/photo";
import { Icon } from "@/components/Icon";
import ProfileForm from "@/components/ProfileForm";
import Completeness from "@/components/Completeness";
import { profileCompletion, profileGaps } from "@/lib/completeness";

// Route ini selalu butuh sesi terbaru dari cookies, jadi memang blocking (Next 16 cache components).
export const instant = false;

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/profile");

  const [{ data: profile }, { data: photos }, { data: interests }, { data: picked }, { data: prefs }, { data: prompts }, { data: myPrompts }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, birthdate, gender, bio, job, city, intent, is_verified, plan, height_cm, exercise, drinking, smoking, pets, zodiac, education, languages, hometown",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("photos").select("id, storage_path, position, caption").eq("profile_id", user.id).order("position"),
      supabase.from("interests").select("id, slug, label").order("label"),
      supabase.from("profile_interests").select("interest_id").eq("profile_id", user.id),
      supabase.from("preferences").select("min_age, max_age, max_distance_km, show_gender").eq("user_id", user.id).maybeSingle(),
      supabase.from("prompts").select("id, text, category").order("id"),
      supabase.from("profile_prompts").select("prompt_id, answer, position").eq("profile_id", user.id).order("position"),
    ]);

  if (!profile) redirect("/onboarding");
  const plan = (profile.plan ?? "free") as Plan;
  const cover = (photos ?? []).map((p: { storage_path: string }) => photoUrl(p.storage_path)).find(Boolean);
  const age = profile.birthdate
    ? Math.floor((Date.now() - new Date(profile.birthdate).getTime()) / 31_556_952_000)
    : null;
  const promptText = new Map((prompts ?? []).map((p: { id: number; text: string }) => [p.id, p.text]));
  const pickedSet = new Set((picked ?? []).map((p: { interest_id: number }) => p.interest_id));
  const pickedLabels = (interests ?? [])
    .filter((i: { id: number }) => pickedSet.has(i.id))
    .map((i: { label: string }) => i.label)
    .slice(0, 4);
  const shownPrompts = (myPrompts ?? []).slice(0, 2) as { prompt_id: number; answer: string }[];
  const completion = profileCompletion(profile, (photos ?? []).length, pickedSet.size, (myPrompts ?? []).length);
  const gaps = profileGaps(profile, (photos ?? []).length, pickedSet.size, (myPrompts ?? []).length);

  return (
    <main className="mx-auto w-full max-w-3xl px-[var(--space-md)] py-[var(--space-lg)]">
      <div className="mb-[var(--space-lg)] flex items-start gap-[var(--space-md)]">
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[999px] border border-line bg-paper-2">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Foto profil" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-ink-soft">
              {(profile.display_name || "B").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold">{profile.display_name || "Profil kamu"}</h1>
            {profile.is_verified === "approved" ? (
              <span
                title="Terverifikasi"
                className="inline-grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-verify text-white"
              >
                <Icon name="check" className="h-3 w-3" strokeWidth={2.8} />
                <span className="sr-only">Terverifikasi</span>
              </span>
            ) : (
              <Link href="/app/verify" className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-ink-soft hover:text-ink">
                Verifikasi wajah
                <span className="rounded-[999px] bg-paper-2 px-1.5 py-0.5 text-[0.65rem] font-medium text-ink">Opsional</span>
              </Link>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Paket aktif: <strong className="text-ink">{PLANS[plan].name}</strong>
          </p>
          <div className="mt-1 flex items-center gap-3 text-sm font-semibold">
            <Link href="/app/premium" className="inline-flex min-h-9 items-center text-blush-deep hover:underline">
              {plan === "free" ? "Lihat paket" : "Kelola paket"}
            </Link>
            <span className="text-ink-faint" aria-hidden="true">·</span>
            <Link href="/app/settings" className="inline-flex min-h-9 items-center text-ink-soft hover:text-ink">
              Pengaturan
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-[var(--space-lg)]">
        <Completeness percent={completion} verified={profile.is_verified === "approved"} gaps={gaps} />
      </div>

      <section className="mb-[var(--space-lg)]">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h2 className="whitespace-nowrap text-base">Pratinjau profil</h2>
          <span className="text-xs text-ink-soft">Begini tampilnya</span>
        </div>
        <div className="overflow-hidden rounded-[22px] border border-line bg-paper">
          <div className="relative aspect-[16/11] w-full bg-paper-2">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover object-[center_28%]" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-x-2 gap-y-1 p-4 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
              <p className="max-w-full truncate text-[1.7rem] font-bold leading-none text-white">
                {profile.display_name || "Nama kamu"}
                {age ? `, ${age}` : ""}
              </p>
              {profile.is_verified === "approved" ? (
                <span
                  title="Terverifikasi"
                  className="inline-grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-verify text-white"
                >
                  <Icon name="check" className="h-3 w-3" strokeWidth={2.8} />
                  <span className="sr-only">Terverifikasi</span>
                </span>
              ) : null}
              <p className="w-fit max-w-full truncate rounded-[6px] bg-black/90 px-1.5 py-0.5 text-sm font-semibold text-white">
                {[profile.job, profile.city].filter(Boolean).join(" · ") || "Lengkapi pekerjaan dan kota"}
              </p>
            </div>
          </div>
          <div className="grid gap-2.5 p-4">
            <p className="line-clamp-3 text-sm leading-relaxed text-ink">
              {profile.bio || "Belum ada bio. Tambahkan satu kalimat yang bikin orang penasaran."}
            </p>
            {shownPrompts.map((p) => (
              <div key={p.prompt_id} className="rounded-[12px] bg-paper-2 px-3 py-2">
                <p className="text-xs font-semibold text-ink-soft">
                  {promptText.get(p.prompt_id) ?? "Prompt"}
                </p>
                <p className="line-clamp-2 text-sm text-ink">{p.answer}</p>
              </div>
            ))}
            {pickedLabels.length ? (
              <div className="flex flex-wrap gap-1.5">
                {pickedLabels.map((label) => (
                  <span key={label} className="rounded-[999px] border border-line bg-paper px-2.5 py-1 text-2xs font-semibold text-ink-soft">
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <ProfileForm
        userId={user.id}
        profile={profile as never}
        photos={(photos ?? []) as never}
        interests={interests ?? []}
        pickedInterests={(picked ?? []).map((p: { interest_id: number }) => p.interest_id)}
        preferences={
          (prefs as { min_age: number; max_age: number; max_distance_km: number; show_gender: string[] }) ?? {
            min_age: 18,
            max_age: 45,
            max_distance_km: 50,
            show_gender: ["woman", "man"],
          }
        }
        prompts={prompts ?? []}
        myPrompts={(myPrompts ?? []) as never}
      />
    </main>
  );
}

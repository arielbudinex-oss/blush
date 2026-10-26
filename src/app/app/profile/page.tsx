import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { PLANS, type Plan } from "@/lib/plans";
import { photoUrl } from "@/lib/photo";
import { Icon } from "@/components/Icon";
import VerifiedBadge from "@/components/VerifiedBadge";
import ProfileForm from "@/components/ProfileForm";
import EmojiText from "@/components/emoji/EmojiText";
import Completeness from "@/components/Completeness";
import { profileCompletion, profileGaps } from "@/lib/completeness";
import { btnGhost } from "@/components/ui";

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
      <div className="mb-[var(--space-md)] flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              {profile.display_name || "Profil kamu"}
              {age ? `, ${age}` : ""}
            </h1>
            {profile.is_verified === "approved" ? (
              <VerifiedBadge />
            ) : (
              <Link href="/app/verify" className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-ink-soft hover:text-ink">
                Verifikasi wajah
                <span className="rounded-[999px] bg-paper-2 px-1.5 py-0.5 text-[0.65rem] font-medium text-ink">Opsional</span>
              </Link>
            )}
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">
            {[profile.job, profile.city].filter(Boolean).join(" · ") || "Lengkapi pekerjaan dan kota"}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold">
            <Link
              href="/app/premium"
              className="inline-flex min-h-7 items-center rounded-[999px] border border-line bg-paper px-2.5 text-ink-soft hover:text-ink"
            >
              {PLANS[plan].name}
            </Link>
            <Link
              href="/app/settings"
              className="inline-flex min-h-7 items-center rounded-[999px] border border-line px-2.5 text-ink-soft hover:text-ink"
            >
              Pengaturan
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-[var(--space-md)]">
        <Completeness percent={completion} verified={profile.is_verified === "approved"} gaps={gaps} href="#edit-profil" />
      </div>

      <section className="mb-[var(--space-lg)]">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="whitespace-nowrap text-base">Pratinjau profil</h2>
          <a
            href="#edit-profil"
            className="-mr-2 inline-flex min-h-11 items-center rounded-full border border-line bg-paper px-3 text-sm font-semibold text-blush-deep hover:border-line-strong"
          >
            Edit
          </a>
        </div>
        <div className="overflow-hidden rounded-[22px] border border-line bg-paper">
          <div className="relative aspect-[16/11] w-full bg-paper-2">
            {cover ? (
              <Image src={cover} alt="" fill sizes="(max-width: 520px) 100vw, 430px" className="object-cover object-[center_28%]" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-x-2 gap-y-1 p-4 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
              <p className="max-w-full truncate text-[1.7rem] font-bold leading-none text-white">
                {profile.display_name || "Nama kamu"}
                {age ? `, ${age}` : ""}
              </p>
              {profile.is_verified === "approved" ? (
                <VerifiedBadge />
              ) : null}
              <p className="w-fit max-w-full truncate rounded-full bg-black/90 px-2 py-0.5 text-sm font-semibold text-white">
                {[profile.job, profile.city].filter(Boolean).join(" · ") || "Lengkapi pekerjaan dan kota"}
              </p>
            </div>
          </div>
          <div className="grid gap-2.5 p-4">
            <p className={`line-clamp-3 text-sm leading-relaxed ${profile.bio ? "text-ink" : "text-ink-soft"}`}>
              <EmojiText
                text={profile.bio || "Belum ada bio. Tambahkan satu kalimat yang bikin orang penasaran."}
              />
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

      <details id="edit-profil" className="group mt-[var(--space-md)] rounded-card border border-line bg-paper px-4 py-3">
        <summary className={`${btnGhost} w-full cursor-pointer list-none justify-between [&::-webkit-details-marker]:hidden`}>
          <span className="inline-flex items-center gap-2">
            <Icon name="plus" className="h-4 w-4 transition-transform group-open:rotate-45" />
            Edit profil
          </span>
          <Icon name="chevron" className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4 border-t border-line pt-4">
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
        </div>
      </details>
    </main>
  );
}

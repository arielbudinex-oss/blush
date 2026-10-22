import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import OnboardingForm from "./OnboardingForm";

export const instant = false;

export default async function OnboardingPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  // Akun yang sudah selesai onboarding tidak boleh melihat form pendaftaran lagi.
  if (profile?.onboarded_at) redirect("/app/discover");

  return <OnboardingForm />;
}

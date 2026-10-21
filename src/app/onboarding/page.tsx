import { connection } from "next/server";
import OnboardingForm from "./OnboardingForm";

export const instant = false;

// Halaman ini butuh Supabase di browser, jadi jangan diprerender saat build.
export default async function OnboardingPage() {
  await connection();
  return <OnboardingForm />;
}

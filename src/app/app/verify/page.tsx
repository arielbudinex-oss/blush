import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import FaceVerify from "@/components/FaceVerify";
import { btnGhost } from "@/components/ui";

export const instant = false;

export default async function VerifyPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/verify");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-4xl px-[var(--space-md)] py-[var(--space-lg)]">
      <header className="mb-[var(--space-lg)]">
        <span className="text-xs font-semibold text-blush-deep">Opsional, bukan wajib</span>
        <h1 className="mt-1 text-3xl font-bold">Verifikasi wajah</h1>
        <p className="mt-2 max-w-prose text-sm text-ink-soft">
          Tanpa verifikasi, profil tetap jalan. Cuma belum genap 100%. Sekali pindai, kamu dapat centang biru. Prosesnya
          di browser; yang dikirim angka wajah, bukan foto atau video.
        </p>
      </header>
      <FaceVerify verified={profile?.is_verified === "approved"} />
      <div className="mt-6">
        <Link href="/app/profile" className={btnGhost}>
          Kembali ke profil
        </Link>
      </div>
    </div>
  );
}

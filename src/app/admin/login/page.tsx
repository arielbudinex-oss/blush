import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";

export const instant = false;
export const metadata = { title: "Masuk admin", robots: { index: false, follow: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ bye?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase("admin");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userClient = await createServerSupabase();
  const { data: { user: userSession } } = await userClient.auth.getUser();
  const loginError = params.error === "admin_required"
    ? "Akun Google ini bukan admin Blush. Gunakan akun admin yang terdaftar."
    : params.error
      ? "Login Google belum selesai. Coba lagi."
      : null;

  if (user) {
    const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (me?.role === "admin") redirect("/admin");
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f3ee] px-4 py-10">
      <div className="w-full max-w-[420px]">
        <a href="/" className="mb-8 block text-center font-display text-3xl font-bold tracking-[-0.04em] text-ink">
          blush
        </a>
        <section className="rounded-[18px] border border-line bg-paper p-6 shadow-[0_16px_50px_-32px_rgba(32,26,20,0.35)] sm:p-7">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-paper">
            <Icon name="lock" className="h-5 w-5" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-[-0.02em] text-ink">Masuk ke admin</h1>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Halaman ini hanya untuk pengelola Blush. Masuk dengan akun admin yang terdaftar.
          </p>

          {params.bye ? (
            <p className="mt-4 rounded-[9px] border border-line bg-paper-2 px-3 py-2 text-sm text-ink-soft">
              Kamu sudah keluar dari admin.
            </p>
          ) : null}
          {loginError ? (
            <p className="mt-4 rounded-[9px] border border-blush-deep/30 bg-blush/10 px-3 py-2 text-sm text-blush-deep">
              {loginError}
            </p>
          ) : null}

          <a
            href="/api/auth/google/start?scope=admin&next=/admin"
            className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-paper font-display text-sm font-bold text-ink">G</span>
            Masuk dengan Google
          </a>
          {userSession ? (
            <p className="mt-3 text-xs leading-5 text-ink-soft">
              Sesi user tetap aktif di Blush. Sesi admin terpisah.
            </p>
          ) : null}
          {user && !userSession ? (
            <p className="mt-3 text-xs leading-5 text-ink-soft">
              Sesi admin tidak aktif. Masuk dengan akun admin untuk membuka panel.
            </p>
          ) : null}

          <p className="mt-6 flex items-start gap-2.5 text-xs font-medium leading-5 text-ink-soft">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
            Sesi admin punya akses ke data operasional. Jangan bagikan akses ke akun lain.
          </p>
        </section>
        <a href="/" className="mt-5 block text-center text-xs font-semibold text-ink-soft hover:text-ink">
          Kembali ke Blush
        </a>
      </div>
    </main>
  );
}

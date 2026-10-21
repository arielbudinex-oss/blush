"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shell, btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (!data.session) {
      setNotice("Akun dibuat. Cek emailmu untuk konfirmasi, lalu masuk.");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  async function google() {
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (err) setError("Daftar dengan Google belum aktif di project ini.");
  }

  return (
    <Shell title="Buat akun Blush" hint="Gratis. Kamu harus berumur 18 tahun atau lebih.">
      <form onSubmit={submit} className="flex flex-col gap-[var(--space-sm)]">
        <div>
          <label className={label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className={inputBase}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="password">
            Password (minimal 8 karakter)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputBase}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm font-medium text-blush-deep">{error}</p> : null}
        {notice ? <p className="text-sm font-medium text-ok">{notice}</p> : null}
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy ? "Membuat akun…" : "Daftar"}
        </button>
        <button type="button" className={btnGhost} onClick={google}>
          Daftar dengan Google
        </button>
      </form>
      <p className="text-sm text-ink-soft">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-blush-deep">
          Masuk
        </Link>
      </p>
    </Shell>
  );
}

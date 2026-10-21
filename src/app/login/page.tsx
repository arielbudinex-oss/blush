"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shell, btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message === "Invalid login credentials" ? "Email atau password salah." : err.message);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next") ?? "/app/discover";
    router.push(next);
    router.refresh();
  }

  async function google() {
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/app/discover` },
    });
    if (err) setError("Login Google belum aktif di project ini. Pakai email dan password dulu.");
  }

  return (
    <Shell title="Masuk ke Blush" hint="Pakai email dan password akunmu.">
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
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputBase}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm font-medium text-blush-deep">{error}</p> : null}
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy ? "Memeriksa…" : "Masuk"}
        </button>
        <button type="button" className={btnGhost} onClick={google}>
          Masuk dengan Google
        </button>
      </form>
      <p className="text-sm text-ink-soft">
        Belum punya akun?{" "}
        <Link href="/signup" className="font-semibold text-blush-deep">
          Daftar
        </Link>
      </p>
    </Shell>
  );
}

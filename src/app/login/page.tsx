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
  const [googleBusy, setGoogleBusy] = useState(false);

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
    setGoogleBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/app/discover` },
    });
    if (err) {
      setGoogleBusy(false);
      console.warn("Google OAuth belum aktif:", err.message);
      setError("Masuk pakai Google belum tersedia. Sementara pakai email dan password dulu, ya.");
    }
  }

  return (
    <Shell title="Masuk ke Blush" hint="Selamat datang lagi.">
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
        <button type="button" className={`${btnGhost} inline-flex items-center justify-center gap-2`} onClick={google} disabled={googleBusy}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.6-5.2 3.6-8.8z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.7z" />
            <path fill="#EA4335" d="M12 4.7c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.7 12 4.7z" />
          </svg>
          {googleBusy ? "Mengalihkan ke Google…" : "Masuk dengan Google"}
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

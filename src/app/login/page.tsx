"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shell, btnGhost, btnPrimary, inputBase, label } from "@/components/ui";

const GOOGLE_ERRORS: Record<string, string> = {
  google_cancelled: "Jendela Google ditutup sebelum selesai. Coba lagi ya.",
  google_state: "Sesi login kedaluwarsa. Coba masuk lagi.",
  google_config: "Login Google belum disiapkan di server ini.",
  google_exchange: "Google menolak permintaan masuk. Coba lagi.",
  google_token: "Identitas Google tidak bisa diverifikasi.",
  google_user: "Akun Google ini tidak bisa dipakai di Blush.",
  google_session: "Gagal membuat sesi. Coba lagi sebentar.",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [next, setNext] = useState("/app/discover");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("error");
    if (code) setError(GOOGLE_ERRORS[code] ?? "Masuk pakai Google gagal. Coba lagi.");
    if (params.get("bye")) setNotice("Kamu sudah keluar. Masuk lagi kapan saja.");
    const target = params.get("next");
    if (target?.startsWith("/")) setNext(target);

    // Sudah punya sesi? Jangan tampilkan form login lagi.
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) router.replace(target?.startsWith("/") ? target : "/app/discover");
      });
  }, []);

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
        {notice ? <p className="text-sm font-medium text-ok">{notice}</p> : null}
        {error ? <p className="text-sm font-medium text-blush-deep">{error}</p> : null}
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy ? "Memeriksa…" : "Masuk"}
        </button>
        <a
          href={`/api/auth/google/start?next=${encodeURIComponent(next)}`}
          className={`${btnGhost} inline-flex items-center justify-center gap-2`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.6-5.2 3.6-8.8z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.7z" />
            <path fill="#EA4335" d="M12 4.7c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.7 12 4.7z" />
          </svg>
          Masuk dengan Google
        </a>
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

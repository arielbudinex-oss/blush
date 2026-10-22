"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminSignOut() {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login?bye=1";
  }
  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="flex min-h-9 w-full items-center rounded-[8px] px-2 text-left text-xs font-semibold text-ink-soft hover:bg-paper-2 hover:text-ink disabled:opacity-60"
    >
      {busy ? "Keluar…" : "Keluar dari admin"}
    </button>
  );
}

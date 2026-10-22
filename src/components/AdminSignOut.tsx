"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

export default function AdminSignOut() {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/login?bye=1";
  }
  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="flex min-h-10 w-full items-center gap-3 rounded-[8px] px-3 text-left text-[13px] font-medium text-ink-soft hover:bg-paper-2 hover:text-ink disabled:opacity-60"
    >
      <Icon name="back" className="h-4 w-4 shrink-0 opacity-70" />
      {busy ? "Keluar…" : "Keluar dari admin"}
    </button>
  );
}

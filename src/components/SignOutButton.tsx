"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnGhost } from "@/components/ui";

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" className={btnGhost} onClick={signOut} disabled={busy}>
      {busy ? "Keluar…" : "Keluar dari akun"}
    </button>
  );
}

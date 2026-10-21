"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnGhost } from "@/components/ui";

export default function UnblockButton({ blockerId, blockedId }: { blockerId: string; blockedId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={btnGhost + " !px-3 !py-1.5 !text-xs"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const supabase = createClient();
        await supabase.from("blocks").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
        setBusy(false);
        router.refresh();
      }}
    >
      {busy ? "…" : "Buka blokir"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

export default function LikeBackButton({ targetId }: { targetId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function likeBack() {
    setState("busy");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setState("error");
      return;
    }
    const { error } = await supabase.from("swipes").insert({
      actor_id: user.id,
      target_id: targetId,
      action: "like",
    });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      setState("error");
      return;
    }
    void fetch("/api/push/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    }).catch(() => {});
    setState("done");
    router.refresh();
  }

  if (state === "done") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-[999px] bg-ok/10 px-3 py-1.5 text-xs font-bold text-ok">
        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> Suka
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={likeBack}
      disabled={state === "busy"}
      aria-label="Suka balik"
      className="inline-flex shrink-0 items-center gap-1 rounded-[999px] bg-blush-deep px-3 py-1.5 text-xs font-bold text-paper transition-colors hover:bg-ink disabled:opacity-60"
    >
      <Icon name="heart" className="h-3.5 w-3.5" filled />
      {state === "busy" ? "Mengirim…" : state === "error" ? "Coba lagi" : "Suka balik"}
    </button>
  );
}

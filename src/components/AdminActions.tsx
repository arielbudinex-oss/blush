"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnGhost, btnPrimary } from "@/components/ui";

export function PaymentRowActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function call(action: "paid" | "expire") {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, action }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? `status: ${json.status}` : (json.error ?? "gagal"));
    router.refresh();
  }

  return (
    <span className="flex items-center gap-2">
      <button type="button" className={btnPrimary + " !px-3 !py-1.5 !text-xs"} disabled={busy} onClick={() => call("paid")}>
        Tandai lunas
      </button>
      <button type="button" className={btnGhost + " !px-3 !py-1.5 !text-xs"} disabled={busy} onClick={() => call("expire")}>
        Kedaluwarsakan
      </button>
      {msg ? <span className="text-xs text-ink-faint">{msg}</span> : null}
    </span>
  );
}

export function VerifyRowActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function call(action: "approve" | "reject") {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/verify/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? "tersimpan" : (json.error ?? "gagal"));
    router.refresh();
  }

  return (
    <span className="flex items-center gap-2">
      <button type="button" className={btnPrimary + " !px-3 !py-1.5 !text-xs"} disabled={busy} onClick={() => call("approve")}>
        Setujui
      </button>
      <button type="button" className={btnGhost + " !px-3 !py-1.5 !text-xs"} disabled={busy} onClick={() => call("reject")}>
        Tolak
      </button>
      {msg ? <span className="text-xs text-ink-faint">{msg}</span> : null}
    </span>
  );
}

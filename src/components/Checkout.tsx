"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { btnGhost, btnPrimary, inputBase, label } from "@/components/ui";
import { formatIdr } from "@/lib/plans";

type CheckoutState =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "ready";
      paymentId: string;
      amountIdr: number;
      qrDataUrl: string;
      payload: string;
      expiresAt: string;
      status: string;
    }
  | { kind: "error"; message: string };

export default function Checkout({
  plan,
  planName,
  priceIdr,
  features,
  popular = false,
}: {
  plan: "plus" | "gold";
  planName: string;
  priceIdr: number;
  features: string[];
  popular?: boolean;
}) {
  const [months, setMonths] = useState(1);
  const [state, setState] = useState<CheckoutState>({ kind: "idle" });
  const total = priceIdr * months;

  useEffect(() => {
    if (state.kind !== "ready") return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/payments/${state.paymentId}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.status && json.status !== "pending") {
        setState({ ...state, status: json.status });
        clearInterval(timer);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [state]);

  async function start() {
    setState({ kind: "loading" });
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, months }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState({ kind: "error", message: json.error ?? "Gagal membuat pembayaran." });
      return;
    }
    setState({
      kind: "ready",
      paymentId: json.paymentId,
      amountIdr: json.amountIdr,
      qrDataUrl: json.qrDataUrl,
      payload: json.payload,
      expiresAt: json.expiresAt,
      status: json.status,
    });
  }

  return (
    <div className={`rounded-card border bg-paper p-[var(--space-md)] ${popular ? "border-blush-deep" : "border-line"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <h3 className="text-xl">{planName}</h3>
        {popular ? (
          <span className="rounded-[999px] bg-blush-deep px-2.5 py-0.5 text-2xs font-semibold text-paper">
            Mulai di sini
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-sm text-ink-soft">
        {formatIdr(priceIdr)} per bulan
        {months > 1 ? ` · total ${formatIdr(total)}` : ""}
      </p>

      <ul className="mt-3 grid gap-1 text-sm text-ink">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" strokeWidth={2.6} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 w-full">
        <label className={label} htmlFor={`months-${plan}`}>
          Durasi
        </label>
        <select
          id={`months-${plan}`}
          className={inputBase}
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          disabled={state.kind === "ready"}
        >
          {[1, 3, 6, 12].map((m) => (
            <option key={m} value={m}>
              {m} bulan
            </option>
          ))}
        </select>
      </div>

      {state.kind === "idle" || state.kind === "loading" ? (
        <button type="button" className={`${btnPrimary} mt-4 w-full`} onClick={start} disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "Menyiapkan QRIS…" : "Bayar pakai QRIS"}
        </button>
      ) : null}

      {state.kind === "error" ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-blush-deep">{state.message}</p>
          <p className="mt-2 text-xs text-ink-faint">
            Kalau QRIS belum dikonfigurasi, hubungi admin lewat halaman Pengaturan untuk aktivasi manual.
          </p>
        </div>
      ) : null}

      {state.kind === "ready" ? (
        <div className="mt-4">
          <p className="text-sm text-ink-soft">
            Nominal: <strong>{formatIdr(state.amountIdr)}</strong> · berlaku sampai{" "}
            {new Date(state.expiresAt).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            WIB
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.qrDataUrl} alt="QRIS pembayaran" className="mt-3 aspect-square w-full max-w-64 rounded-[8px] border border-line bg-paper object-contain" />
          <p className="mt-2 text-xs text-ink-faint">
            Scan pakai aplikasi bank atau e-wallet apa pun yang mendukung QRIS. Status:{" "}
            <strong>{state.status === "pending" ? "menunggu pembayaran" : state.status}</strong>
          </p>
          <details className="mt-3 text-xs text-ink-faint">
            <summary className="cursor-pointer font-semibold">Payload QRIS (untuk verifikasi manual)</summary>
            <code className="mt-2 block break-all rounded-[8px] border border-line bg-paper-2 p-2">{state.payload}</code>
          </details>
          <button type="button" className={`${btnGhost} mt-3`} onClick={() => setState({ kind: "idle" })}>
            Buat pembayaran lain
          </button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const KEY = "blush_session";

function sessionId() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
    const id = globalThis.crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function send(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ ...payload, sessionId: sessionId() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Analitik tidak boleh mengganggu halaman.
  }
}

/** Mencatat page view dan klik tautan. IP dan perangkat diproses di server. */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    // Jangan kotori analitik produksi dengan kunjungan dari server lokal.
    if (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) return;

    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      send({ eventType: "page_view", path: pathname, referrer: document.referrer || null });
    }

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      send({
        eventType: "link_click",
        path: window.location.pathname,
        target: href.slice(0, 500),
        label: (link.getAttribute("aria-label") || link.textContent || "").trim().slice(0, 120),
      });
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pathname]);

  return null;
}

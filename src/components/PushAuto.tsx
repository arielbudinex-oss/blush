"use client";

import { useEffect } from "react";
import { pushSupported, subscribeToPush } from "@/lib/push-client";

const PENDING = "blush_push_pending";

/**
 * Pastikan perangkat sudah benar-benar berlangganan setiap aplikasi dibuka.
 * Ini juga menyelamatkan kasus izin sudah diberikan tetapi langganan belum tersimpan.
 */
export default function PushAuto() {
  useEffect(() => {
    if (!pushSupported()) return;
    if (Notification.permission !== "granted") return;

    let alive = true;
    void subscribeToPush()
      .then(() => {
        if (!alive) return;
        try {
          localStorage.removeItem(PENDING);
          localStorage.setItem("blush_push_active", "1");
        } catch {
          // abaikan
        }
      })
      .catch((e) => console.error("push auto subscribe", e));

    return () => {
      alive = false;
    };
  }, []);

  return null;
}

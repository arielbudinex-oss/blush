"use client";

import { useEffect } from "react";
import { pushSupported, subscribeToPush } from "@/lib/push-client";

const PENDING = "blush_push_pending";

/** Setelah izin diberikan, browser perlu reload; proses langganan diselesaikan di sini. */
export default function PushAuto() {
  useEffect(() => {
    if (!pushSupported()) return;
    let pending = false;
    try {
      pending = localStorage.getItem(PENDING) === "1";
    } catch {
      return;
    }
    if (!pending || Notification.permission !== "granted") return;

    void subscribeToPush()
      .then(() => {
        try {
          localStorage.removeItem(PENDING);
          localStorage.setItem("blush_push_active", "1");
        } catch {
          // abaikan
        }
      })
      .catch((e) => console.error("push auto subscribe", e));
  }, []);

  return null;
}

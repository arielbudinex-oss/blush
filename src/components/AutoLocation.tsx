"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Deteksi lokasi otomatis setelah login kalau profil belum punya koordinat.
 * Hanya untuk menghitung jarak; tidak menampilkan koordinat ke orang lain.
 */
export default function AutoLocation({ userId }: { userId: string }) {
  useEffect(() => {
    if (!navigator.geolocation) return;
    if (sessionStorage.getItem("blush_loc_asked") === "1") return;
    sessionStorage.setItem("blush_loc_asked", "1");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const supabase = createClient();
        await supabase
          .from("profiles")
          .update({ location: `SRID=4326;POINT(${pos.coords.longitude} ${pos.coords.latitude})` })
          .eq("id", userId);
      },
      () => {
        // Izin ditolak atau tidak tersedia: jarak memakai kota saja.
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  }, [userId]);

  return null;
}

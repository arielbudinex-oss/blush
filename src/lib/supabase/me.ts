import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";

export type MePreferences = {
  min_age: number;
  max_age: number;
  max_distance_km: number;
  show_gender: string[];
  verified_only: boolean;
  search_lat: number | null;
  search_lng: number | null;
};

export type MeProfile = {
  display_name: string | null;
  onboarded_at: string | null;
  plan: string | null;
  plan_expires_at: string | null;
  is_verified: string | null;
  last_active_at: string | null;
  location: string | null;
  preferences: MePreferences | null;
  photos: { storage_path: string; position: number }[] | null;
};

/**
 * Satu kali ambil user + profil per request.
 * Layout dan page berbagi hasil yang sama lewat cache React, jadi tidak ada
 * dua panggilan auth dan dua query profil untuk satu navigasi.
 */
export const getMe = cache(async () => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as MeProfile | null };

  const { data } = await supabase
    .from("profiles")
    .select(
      "display_name, onboarded_at, plan, plan_expires_at, is_verified, last_active_at, location, preferences(min_age, max_age, max_distance_km, show_gender, verified_only, search_lat, search_lng), photos(storage_path, position)",
    )
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, profile: (data as MeProfile | null) ?? null };
});

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Client yang jalan sebagai user yang sedang login (RLS berlaku). */
export async function createServerSupabase(scope: "user" | "admin" = "user") {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: scope === "admin" ? { name: "blush-admin-auth" } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // dipanggil dari Server Component: aman diabaikan, middleware yang refresh.
          }
        },
      },
    },
  );
}

export async function getSessionUser() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

import { createBrowserClient } from "@supabase/ssr";

export function createClient(scope: "user" | "admin" = "user") {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    scope === "admin"
      ? { cookieOptions: { name: "blush-admin-auth" }, isSingleton: false }
      : undefined,
  );
}

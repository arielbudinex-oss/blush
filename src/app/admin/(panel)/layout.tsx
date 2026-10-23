import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import AdminSidebar from "@/components/AdminSidebar";
import AdminSignOut from "@/components/AdminSignOut";

export const instant = false;

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Halaman admin</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Akun ini bukan admin. Hubungi pemilik Blush kalau kamu merasa seharusnya punya akses.
        </p>
        <div className="mt-5 max-w-xs">
          <AdminSignOut />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f6f3ee]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col lg:flex-row">
        <AdminSidebar />
        <main className="min-w-0 flex-1 px-4 py-5 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

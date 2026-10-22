import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/app", "/onboarding", "/admin"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const adminLogin = path === "/admin/login";
  if (!user && !adminLogin && PROTECTED.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = path.startsWith("/admin") ? "/admin/login" : "/login";
    url.search = "";
    if (!path.startsWith("/admin")) url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Akun yang sudah punya sesi tidak boleh membuka form masuk/daftar lagi.
  if (user && (path === "/login" || path === "/signup")) {
    const target = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = target?.startsWith("/") && !target.startsWith("//") ? target : "/app/discover";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Akun lama tidak boleh mendarat di form pendaftaran setelah login ulang.
  if (user && path === "/onboarding") {
    const { data: profile } = await supabase.from("profiles").select("onboarded_at").eq("id", user.id).maybeSingle();
    if (profile?.onboarded_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/discover";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)"],
};

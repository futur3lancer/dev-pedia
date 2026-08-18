import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Owner-only auth guard + session refresh. Personal tool ito kaya simple
// lang ang panuntunan: kailangan ng session para sa lahat ng route maliban
// sa /login mismo. Ang mga /api/* route ay tumatanggap ng 401 JSON sa
// halip na i-redirect, dahil hindi naman browser navigation ang gumagamit
// dito.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api");

  if (!session && !isLoginRoute) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Naka-sign in na pero pumunta pa rin sa /login — walang dahilan para
  // makita pa niya ang form, diretso sa dashboard.
  if (session && isLoginRoute) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|offline.html|icons/).*)",
  ],
};

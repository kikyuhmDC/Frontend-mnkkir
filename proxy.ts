import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic route protection (Next.js 16 "proxy", formerly middleware).
 *
 * The real session (JWT access + refresh tokens) lives in localStorage so the
 * API client can attach Bearer headers from the browser. A lightweight
 * `orderly_session` cookie is kept in sync with that storage
 * (see lib/auth-storage.ts) purely so this proxy can:
 *
 *   - bounce logged-out visitors away from /dashboard/* → /login
 *   - bounce logged-in visitors away from /login & /register → /dashboard
 *
 * The cookie is only a hint; components/auth-guard.tsx re-verifies the actual
 * session on the client.
 */

const SESSION_COOKIE = "orderly_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const isDashboardRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isDashboardRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all app routes except:
     * - _next/static, _next/image (static assets)
     * - favicon, icons, images, files (public assets)
     * - api routes
     */
    "/((?!_next/static|_next/image|api|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};

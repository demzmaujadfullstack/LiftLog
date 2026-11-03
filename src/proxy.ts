import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/overview",
  "/workout",
  "/exercises",
  "/programs",
  "/body-progress",
  "/analytics",
  "/nutrition",
  "/calendar",
  "/goals",
  "/progress-photos",
  "/settings",
  "/admin",
];

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"];

function hasSessionCookie(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-authjs.session-token")?.value
  );
}

// Proteksi rute di tingkat edge (cek keberadaan cookie sesi).
// Otorisasi sesungguhnya (role, ownership) tetap diverifikasi
// server-side di setiap layout/page/action menggunakan auth() + Prisma.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const loggedIn = hasSessionCookie(req);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);

  if (isProtected && !loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAuthPage && loggedIn && pathname !== "/reset-password") {
    const url = req.nextUrl.clone();
    url.pathname = "/overview";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icons|manifest.webmanifest|sw.js|offline|favicon.ico|.*\\.svg$|.*\\.png$).*)"],
};

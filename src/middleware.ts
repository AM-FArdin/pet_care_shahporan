import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets, images, and Next.js internal files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.jpg" ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Read and verify admin session token
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  const isAuthenticated = !!session;

  // 3. If accessing /login
  if (pathname === "/login") {
    if (isAuthenticated) {
      // Already logged in, redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 4. If not authenticated
  if (!isAuthenticated) {
    // If it's an API request, return 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required to access clinic records." },
        { status: 401 }
      );
    }

    // For pages, redirect to /login with redirect target
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.jpg
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.jpg).*)",
  ],
};

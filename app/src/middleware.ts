import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Proteger rutas /admin/* ─────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const refreshToken = request.cookies.get("refresh-token")?.value;

    if (!refreshToken) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Resolver slug → tenantId para rutas de tienda pública ──────────────
  // Match: /[slug]/* (excluye /admin, /auth, /api, /_next)
  const storeMatch = pathname.match(/^\/([a-z0-9-]+)(\/.*)?$/);
  const excluded = new Set(["admin", "auth", "api", "_next", "favicon.ico"]);

  if (storeMatch && !excluded.has(storeMatch[1])) {
    const slug = storeMatch[1];

    // Si ya viene el tenantId en el header (cached por edge), pasarlo
    const existingTenantId = request.headers.get("x-tenant-id");
    if (existingTenantId) {
      return NextResponse.next();
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/stores/${slug}/tenant-id`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // Timeout de edge
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) {
        // Slug inválido → not-found
        return NextResponse.rewrite(new URL("/not-found", request.url));
      }

      const data = (await res.json()) as { data?: { tenantId: string } };
      const tenantId = data.data?.tenantId;

      if (!tenantId) {
        return NextResponse.rewrite(new URL("/not-found", request.url));
      }

      const response = NextResponse.next();
      response.headers.set("x-tenant-id", tenantId);
      response.headers.set("x-store-slug", slug);
      return response;
    } catch {
      // Error de red → no bloquear, continuar sin tenantId
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

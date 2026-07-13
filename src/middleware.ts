import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/auth";

const PROTECTED_PAGE_PREFIXES = ["/empregado", "/cozinha", "/caixa", "/admin"];
const PROTECTED_API_PREFIXES = [
  "/api/state",
  "/api/tables",
  "/api/orders",
  "/api/kitchen",
  "/api/cashier",
  "/api/menu",
  "/api/admin",
];

function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/api/auth")) return false;
  if (PROTECTED_PAGE_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);

  if (valid) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sessão inválida ou expirada" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/acesso";
  loginUrl.searchParams.set("dest", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/empregado/:path*",
    "/cozinha/:path*",
    "/caixa/:path*",
    "/admin/:path*",
    "/api/menu",
    "/api/admin/:path*",
    "/api/state",
    "/api/tables/:path*",
    "/api/orders/:path*",
    "/api/kitchen/:path*",
    "/api/cashier/:path*",
  ],
};

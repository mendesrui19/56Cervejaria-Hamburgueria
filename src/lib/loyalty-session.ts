import { NextResponse } from "next/server";
import {
  createLoyaltySessionToken,
  getLoyaltySessionMaxAgeSeconds,
  LOYALTY_SESSION_COOKIE,
  verifyLoyaltySessionToken,
} from "@/lib/loyalty-auth";

export async function getLoyaltyMemberIdFromRequest(
  request: Request
): Promise<string | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${LOYALTY_SESSION_COOKIE}=([^;]+)`)
  );
  const token = match?.[1] ? decodeURIComponent(match[1]) : null;
  return verifyLoyaltySessionToken(token);
}

export async function setLoyaltySessionCookie(
  response: NextResponse,
  memberId: string
) {
  const { token, expiresAt } = await createLoyaltySessionToken(memberId);
  response.cookies.set(LOYALTY_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getLoyaltySessionMaxAgeSeconds(expiresAt),
  });
}

export function clearLoyaltySessionCookie(response: NextResponse) {
  response.cookies.set(LOYALTY_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function loyaltySessionUnauthorized() {
  return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
}

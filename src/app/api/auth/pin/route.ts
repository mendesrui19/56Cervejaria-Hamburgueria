import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  getSessionMaxAgeSeconds,
  isValidPin,
} from "@/lib/auth";

export async function POST(request: Request) {
  let pin = "";

  try {
    const body = await request.json();
    pin = String(body.pin ?? "").trim();
  } catch {
    return NextResponse.json({ error: "PIN inválido" }, { status: 400 });
  }

  if (!isValidPin(pin)) {
    return NextResponse.json({ error: "PIN incorreto" }, { status: 401 });
  }

  const { token, expiresAt } = await createSessionToken();
  const response = NextResponse.json({
    ok: true,
    expiresAt,
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getSessionMaxAgeSeconds(expiresAt),
  });

  return response;
}

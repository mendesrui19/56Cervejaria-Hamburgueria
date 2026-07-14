import { NextResponse } from "next/server";
import { loginLoyaltyMember } from "@/lib/loyalty-store";
import {
  clearLoyaltySessionCookie,
  setLoyaltySessionCookie,
} from "@/lib/loyalty-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      pin?: string;
    };
    const member = await loginLoyaltyMember({
      phone: body.phone ?? "",
      pin: body.pin ?? "",
    });
    const response = NextResponse.json(member);
    await setLoyaltySessionCookie(response, member.id);
    return response;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearLoyaltySessionCookie(response);
  return response;
}

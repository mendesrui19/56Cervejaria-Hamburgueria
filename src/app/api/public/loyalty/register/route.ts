import { NextResponse } from "next/server";
import { registerLoyaltyMember } from "@/lib/loyalty-store";
import { setLoyaltySessionCookie } from "@/lib/loyalty-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      phone?: string;
      birthDate?: string;
      pin?: string;
      referredByCode?: string;
    };
    const member = await registerLoyaltyMember({
      name: body.name ?? "",
      phone: body.phone ?? "",
      birthDate: body.birthDate ?? "",
      pin: body.pin ?? "",
      referredByCode: body.referredByCode,
    });
    const response = NextResponse.json(member);
    await setLoyaltySessionCookie(response, member.id);
    return response;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}

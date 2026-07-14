import { NextResponse } from "next/server";
import { parseLoyaltyQrPayload } from "@/lib/loyalty";
import {
  addLoyaltyStamp,
  getLoyaltyMemberByCode,
} from "@/lib/loyalty-store";

export async function GET(request: Request) {
  try {
    const code = new URL(request.url).searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Código em falta" }, { status: 400 });
    }

    const parsed = parseLoyaltyQrPayload(code) ?? code.trim().toUpperCase();
    const member = await getLoyaltyMemberByCode(parsed);
    if (!member) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      memberCode?: string;
      addedBy?: string;
    };

    const raw = body.memberCode?.trim();
    if (!raw) {
      return NextResponse.json({ error: "Código em falta" }, { status: 400 });
    }

    const parsed = parseLoyaltyQrPayload(raw) ?? raw.toUpperCase();
    const result = await addLoyaltyStamp({
      memberCode: parsed,
      addedBy: body.addedBy,
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}

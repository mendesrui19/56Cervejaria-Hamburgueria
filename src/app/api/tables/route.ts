import { NextResponse } from "next/server";
import { openTable } from "@/lib/store";
import { assertTableNumber } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableNumber, waiterName, guestCount } = body;

    if (!tableNumber || !waiterName) {
      return NextResponse.json(
        { error: "Mesa e nome do empregado são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await openTable(
      assertTableNumber(Number(tableNumber)),
      String(waiterName),
      guestCount
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}

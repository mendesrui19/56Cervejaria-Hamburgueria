import { NextResponse } from "next/server";
import { mergeTables } from "@/lib/store";
import { assertTableNumber, parseTableNumber } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tableNumber: string }> }
) {
  try {
    const { tableNumber } = await params;
    const body = await request.json();
    const result = await mergeTables(
      parseTableNumber(tableNumber),
      assertTableNumber(Number(body.withTableNumber))
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}

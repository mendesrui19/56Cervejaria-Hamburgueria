import { NextResponse } from "next/server";
import { clearTable } from "@/lib/store";
import { parseTableNumber } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tableNumber: string }> }
) {
  try {
    const { tableNumber } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      actor?: string;
    };
    const table = await clearTable(parseTableNumber(tableNumber), body.actor);
    return NextResponse.json(table);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}

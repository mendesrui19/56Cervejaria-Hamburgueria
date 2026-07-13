import { NextResponse } from "next/server";
import { processPayment } from "@/lib/store";
import { parseTableNumber } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tableNumber: string }> }
) {
  try {
    const { tableNumber } = await params;
    const body = await request.json();
    const result = await processPayment(parseTableNumber(tableNumber), body);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro";
    const status = message.includes("já foi pago") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

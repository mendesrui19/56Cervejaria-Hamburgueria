import { NextResponse } from "next/server";
import { requestBill } from "@/lib/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tableNumber: string }> }
) {
  try {
    const { tableNumber } = await params;
    const table = await requestBill(parseInt(tableNumber, 10));
    return NextResponse.json(table);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { reopenTableRound } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tableNumber: string }> }
) {
  try {
    const { tableNumber } = await params;
    let actor: string | undefined;
    try {
      const body = (await request.json()) as { actor?: string };
      actor = body.actor;
    } catch {
      /* sem body */
    }
    const table = await reopenTableRound(parseInt(tableNumber, 10), actor);
    return NextResponse.json(table);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}

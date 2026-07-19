import { NextResponse } from "next/server";
import { addDiningTable } from "@/lib/store";

export async function POST(request: Request) {
  try {
    let actorName: string | undefined;
    try {
      const body = await request.json();
      if (typeof body?.actorName === "string") {
        actorName = body.actorName;
      }
    } catch {
      /* body opcional */
    }

    const table = await addDiningTable(actorName);
    return NextResponse.json({ table });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}

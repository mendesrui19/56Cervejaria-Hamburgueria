import { NextResponse } from "next/server";
import { updateTableGuestCount } from "@/lib/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tableNumber: string }> }
) {
  try {
    const { tableNumber } = await params;
    const body = (await request.json()) as { guestCount?: number };

    if (body.guestCount === undefined || !Number.isFinite(body.guestCount)) {
      return NextResponse.json(
        { error: "guestCount é obrigatório" },
        { status: 400 }
      );
    }

    const table = await updateTableGuestCount(
      parseInt(tableNumber, 10),
      body.guestCount
    );
    return NextResponse.json(table);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}

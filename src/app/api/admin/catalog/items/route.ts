import { NextResponse } from "next/server";
import { createCatalogItem } from "@/lib/catalog";
import type { CreateMenuItemPayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateMenuItemPayload;
    const item = await createCatalogItem(payload);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao criar produto" },
      { status: 400 }
    );
  }
}

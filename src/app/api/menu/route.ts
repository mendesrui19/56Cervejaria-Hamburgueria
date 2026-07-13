import { NextResponse } from "next/server";
import { getActiveCatalog } from "@/lib/catalog";

export async function GET() {
  const catalog = await getActiveCatalog();
  return NextResponse.json(catalog);
}

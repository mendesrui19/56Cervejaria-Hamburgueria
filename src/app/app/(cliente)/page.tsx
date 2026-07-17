import { redirect } from "next/navigation";
import FidelizacaoPageClient from "@/views/FidelizacaoPageClient";
import { FEATURE_LOYALTY } from "@/lib/feature-flags";

export default function FidelizacaoPage() {
  if (!FEATURE_LOYALTY) redirect("/");
  return <FidelizacaoPageClient />;
}

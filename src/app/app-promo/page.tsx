import { redirect } from "next/navigation";
import AppPromoView from "@/views/AppPromoView";
import { FEATURE_LOYALTY } from "@/lib/feature-flags";

export const metadata = {
  title: "App 56 — Cinquenta & Seis",
  description:
    "Cartão de selos, desafios, QR e recompensas da Cinquenta & Seis.",
};

export default function AppPromoPage() {
  if (!FEATURE_LOYALTY) redirect("/");
  return <AppPromoView />;
}

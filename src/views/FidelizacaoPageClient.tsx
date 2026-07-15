"use client";

import dynamic from "next/dynamic";
import { LoyaltyLoader } from "@/components/fidelizacao/LoyaltyLoader";

const FidelizacaoView = dynamic(() => import("@/views/FidelizacaoView"), {
  ssr: false,
  loading: () => <LoyaltyLoader label="A carregar cartão…" />,
});

export default function FidelizacaoPageClient() {
  return <FidelizacaoView />;
}

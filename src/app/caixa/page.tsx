"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/PageLoader";

const CaixaView = dynamic(() => import("@/views/CaixaView"), {
  ssr: false,
  loading: () => <PageLoader title="Caixa" />,
});

export default function CaixaPage() {
  return <CaixaView />;
}

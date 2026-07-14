"use client";

import dynamic from "next/dynamic";

const FidelizacaoView = dynamic(() => import("@/views/FidelizacaoView"), {
  ssr: false,
  loading: () => (
    <div className="loyalty-app">
      <div className="loyalty-loading">A carregar cartão…</div>
    </div>
  ),
});

export default function FidelizacaoPageClient() {
  return <FidelizacaoView />;
}

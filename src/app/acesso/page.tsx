"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PinScreen } from "@/components/PinScreen";

function AcessoContent() {
  const searchParams = useSearchParams();
  const dest = searchParams.get("dest") ?? "/";

  const safeDest =
    dest.startsWith("/") &&
    !dest.startsWith("/acesso") &&
    dest !== "/"
      ? dest
      : "/empregado";

  return (
    <PinScreen
      title="Acesso Staff"
      subtitle="PIN válido até ao fim do serviço (04:00)"
      dest={safeDest}
    />
  );
}

export default function AcessoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-brand-muted">
          A carregar…
        </div>
      }
    >
      <AcessoContent />
    </Suspense>
  );
}

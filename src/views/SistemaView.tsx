"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { PinScreen } from "@/components/PinScreen";

const roles = [
  {
    href: "/empregado",
    title: "Empregado de Mesa",
    abbr: "EMP",
    description:
      "Tomar pedidos, personalizar hambúrgueres, adicionar extras e enviar para a cozinha.",
    color: "from-amber-50 to-white",
  },
  {
    href: "/cozinha",
    title: "Cozinha",
    abbr: "CZ",
    description:
      "Ver todos os pedidos com ingredientes completos. Marcar como pronto.",
    color: "from-red-50 to-white",
  },
  {
    href: "/caixa",
    title: "Caixa",
    abbr: "CX",
    description:
      "Pagamentos, contas por mesa e gestão de mesas quando for preciso.",
    color: "from-green-50 to-white",
  },
  {
    href: "/admin",
    title: "Admin",
    abbr: "ADM",
    description:
      "Gerir catálogo e preços, histórico de mesas e KPIs do restaurante.",
    color: "from-blue-50 to-white",
  },
  {
    href: "/app/scanner",
    title: "App 56",
    abbr: "56",
    description:
      "Ler QR do cliente e adicionar selos ao cartão App 56.",
    color: "from-purple-50 to-white",
  },
];

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/")) return null;
  if (next.startsWith("/acesso") || next.startsWith("/sistema")) return null;
  return next;
}

function SistemaMenu() {
  return (
    <main className="staff-safe-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="text-center mb-8 sm:mb-12 max-w-lg">
        <Link
          href="/"
          className="inline-block text-brand-muted text-xs font-semibold uppercase tracking-widest mb-4 hover:text-brand-gold transition-colors"
        >
          Voltar ao site
        </Link>
        <p className="text-brand-gold text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2">
          Sistema de Gestão
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-gold mb-3">
          Cinquenta & Seis
        </h1>
        <p className="text-brand-muted text-base sm:text-lg px-2">
          Pedidos em tempo real — do empregado à cozinha e à caixa.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-5 w-full max-w-2xl">
        {roles.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            className={`card bg-gradient-to-r ${role.color} active:scale-[0.98] transition-transform touch-manipulation min-h-[80px] border-brand-line shadow-sm`}
          >
            <div className="flex items-center gap-4 sm:gap-5">
              <span className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl bg-brand-gold/10 border border-brand-gold/25 flex items-center justify-center text-brand-gold font-display font-bold text-xs sm:text-sm tracking-wider">
                {role.abbr}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-brand-gold">
                  {role.title}
                </h2>
                <p className="text-brand-muted text-sm mt-0.5 leading-snug">
                  {role.description}
                </p>
              </div>
              <span className="text-brand-gold text-sm font-bold uppercase tracking-wider opacity-60">
                Abrir
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-brand-muted text-xs mt-8 sm:mt-10 text-center max-w-md px-4 leading-relaxed">
        Instala esta app no ecrã inicial para abrir sempre aqui (Android:
        Instalar · iPhone: Partilhar → Adicionar ao Ecrã Principal). PIN válido
        até às 04:00.
      </p>
    </main>
  );
}

function SistemaGate() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [auth, setAuth] = useState<boolean | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      if (!res.ok) {
        setAuth(false);
        return;
      }
      const data = await res.json();
      setAuth(Boolean(data.authenticated));
    } catch {
      setAuth(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (auth && next) {
      window.location.replace(next);
    }
  }, [auth, next]);

  if (auth === null) {
    return (
      <div className="staff-safe-screen flex items-center justify-center text-brand-muted">
        A carregar…
      </div>
    );
  }

  if (!auth) {
    return (
      <PinScreen
        title="Acesso Staff"
        subtitle="PIN válido até ao fim do serviço (04:00)"
        dest={next ?? "/sistema"}
        onSuccess={next ? undefined : checkSession}
      />
    );
  }

  if (next) {
    return (
      <div className="staff-safe-screen flex items-center justify-center text-brand-muted">
        A abrir…
      </div>
    );
  }

  return <SistemaMenu />;
}

export default function SistemaView() {
  return (
    <Suspense
      fallback={
        <div className="staff-safe-screen flex items-center justify-center text-brand-muted">
          A carregar…
        </div>
      }
    >
      <SistemaGate />
    </Suspense>
  );
}

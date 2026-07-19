"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { PinScreen } from "@/components/PinScreen";
import { FEATURE_LOYALTY } from "@/lib/feature-flags";
import {
  enterStaffFullscreen,
  exitStaffFullscreen,
} from "@/lib/staff-fullscreen";

const roles = [
  {
    href: "/empregado",
    title: "Empregado",
    abbr: "EMP",
    tone: "empregado",
  },
  {
    href: "/cozinha",
    title: "Cozinha",
    abbr: "CZ",
    tone: "cozinha",
  },
  {
    href: "/caixa",
    title: "Caixa",
    abbr: "CX",
    tone: "caixa",
  },
  {
    href: "/gestor56",
    title: "Gestor56",
    abbr: "G56",
    tone: "admin",
  },
  ...(FEATURE_LOYALTY
    ? [
        {
          href: "/app/scanner",
          title: "App 56",
          abbr: "56",
          tone: "app56",
        },
      ]
    : []),
];

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/")) return null;
  if (next.startsWith("/acesso") || next.startsWith("/sistema")) return null;
  return next;
}

function SistemaMenu() {
  return (
    <main className="staff-shell sistema-hub">
      <header className="sistema-hub-header">
        <p className="sistema-hub-kicker">Staff</p>
        <h1 className="sistema-hub-title">Cinquenta & Seis</h1>
      </header>

      <div
        className={`sistema-hub-grid ${FEATURE_LOYALTY ? "sistema-hub-grid--with-app" : ""}`}
      >
        {roles.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            onClick={() => {
              void enterStaffFullscreen();
            }}
            className={`sistema-hub-tile sistema-hub-tile--${role.tone}`}
          >
            <span className="sistema-hub-tile-accent" aria-hidden="true" />
            <span className="sistema-hub-abbr" aria-hidden="true">
              {role.abbr}
            </span>
            <span className="sistema-hub-tile-copy">
              <span className="sistema-hub-label">{role.title}</span>
              <span className="sistema-hub-open">Abrir</span>
            </span>
          </Link>
        ))}
      </div>

      <footer className="sistema-hub-footer">
        <Link
          href="/"
          className="sistema-hub-footer-link"
          onClick={() => {
            void exitStaffFullscreen();
          }}
        >
          Site
        </Link>
        <span className="sistema-hub-footer-sep" aria-hidden="true">
          ·
        </span>
        <span>PIN até 04:00</span>
      </footer>
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
      <div className="staff-shell items-center justify-center text-brand-muted">
        A carregar…
      </div>
    );
  }

  if (!auth) {
    return (
      <PinScreen
        title="Acesso Staff"
        subtitle="PIN até 04:00"
        dest={next ?? "/sistema"}
        onSuccess={next ? undefined : checkSession}
      />
    );
  }

  if (next) {
    return (
      <div className="staff-shell items-center justify-center text-brand-muted">
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
        <div className="staff-shell items-center justify-center text-brand-muted">
          A carregar…
        </div>
      }
    >
      <SistemaGate />
    </Suspense>
  );
}

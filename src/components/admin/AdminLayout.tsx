"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { FEATURE_LOYALTY } from "@/lib/feature-flags";

export type AdminSection =
  | "relatorios"
  | "operacoes"
  | "historico"
  | "auditoria"
  | "fidelizacao"
  | "catalogo";

const NAV_ALL: { id: AdminSection; label: string; desc: string }[] = [
  { id: "relatorios", label: "Dashboard", desc: "Sala + números" },
  { id: "operacoes", label: "Operações", desc: "Mapa ao vivo" },
  { id: "historico", label: "Histórico", desc: "Contas fechadas" },
  { id: "auditoria", label: "Auditoria", desc: "Excepções" },
  { id: "fidelizacao", label: "App 56", desc: "Cartão de selos" },
  { id: "catalogo", label: "Catálogo", desc: "Preços e menu" },
];

const NAV = FEATURE_LOYALTY
  ? NAV_ALL
  : NAV_ALL.filter((item) => item.id !== "fidelizacao");

interface AdminLayoutProps {
  section: AdminSection;
  onSection: (s: AdminSection) => void;
  title: string;
  subtitle?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

function NavButton({
  item,
  active,
  onClick,
  compact,
}: {
  item: (typeof NAV)[0];
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl transition-colors touch-manipulation ${
        compact ? "px-3 py-2.5" : "px-3 py-3"
      } ${
        active
          ? "bg-amber-50 border border-amber-300 text-brand-gold"
          : "text-brand-muted hover:text-brand-gold hover:bg-brand-dark border border-transparent"
      }`}
    >
      <span className="block text-sm font-bold">{item.label}</span>
      {!compact && (
        <span className="block text-[11px] opacity-70 mt-0.5">{item.desc}</span>
      )}
    </button>
  );
}

export function AdminLayout({
  section,
  onSection,
  title,
  subtitle,
  toolbar,
  children,
}: AdminLayoutProps) {
  return (
    <div className="admin-shell">
      <aside className="admin-shell-aside">
        <div className="p-4 border-b border-brand-line shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">
            Gestão
          </p>
          <h1 className="font-display text-lg font-bold text-brand-gold mt-1">
            Gestor56
          </h1>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
          {NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={section === item.id}
              onClick={() => onSection(item.id)}
            />
          ))}
        </nav>

        <div className="mt-auto p-3 border-t border-brand-line shrink-0">
          <Link
            href="/sistema"
            className="block rounded-xl px-3 py-2.5 text-xs font-semibold text-brand-muted hover:text-brand-gold hover:bg-brand-surface transition-colors"
          >
            ← Sistema
          </Link>
        </div>
      </aside>

      <div className="admin-shell-main pb-[72px] md:pb-0">
        <AppHeader
          title={title}
          subtitle={subtitle}
          actions={toolbar}
        />

        <main className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 lg:p-6">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-brand-line bg-white/95 backdrop-blur-md safe-bottom">
        <div className="flex overflow-x-auto gap-1 p-2 scrollbar-thin">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => onSection(item.id)}
              className={`shrink-0 rounded-xl py-2.5 px-3 text-center touch-manipulation min-h-[52px] min-w-[72px] ${
                section === item.id
                  ? "bg-brand-gold text-white"
                  : "text-brand-muted"
              }`}
            >
              <span className="block text-[10px] font-bold leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export { NAV };

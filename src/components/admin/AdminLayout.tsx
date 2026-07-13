"use client";

import Link from "next/link";

export type AdminSection = "relatorios" | "historico" | "catalogo";

const NAV: { id: AdminSection; label: string; desc: string }[] = [
  { id: "relatorios", label: "Relatórios", desc: "Dia, semana e mês" },
  { id: "historico", label: "Histórico", desc: "Contas e detalhe" },
  { id: "catalogo", label: "Catálogo", desc: "Preços e menu" },
];

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
    <div className="min-h-dvh flex bg-brand-dark staff-safe-screen">
      <aside className="hidden md:flex w-56 lg:w-60 shrink-0 flex-col border-r border-brand-line bg-white">
        <div className="p-4 border-b border-brand-line">
          <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">
            Gestão
          </p>
          <h1 className="font-display text-lg font-bold text-brand-gold mt-1">
            Admin
          </h1>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={section === item.id}
              onClick={() => onSection(item.id)}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-brand-line">
          <Link
            href="/sistema"
            className="block rounded-xl px-3 py-2.5 text-xs font-semibold text-brand-muted hover:text-brand-gold hover:bg-brand-surface transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 pb-[72px] md:pb-0">
        <header className="sticky top-0 z-30 border-b border-brand-line bg-white/95 backdrop-blur-md safe-top">
          <div className="px-4 py-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-brand-gold">
                {title}
              </h2>
              {subtitle && (
                <p className="text-brand-muted text-sm mt-0.5">{subtitle}</p>
              )}
            </div>
            {toolbar && <div className="shrink-0">{toolbar}</div>}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-brand-line bg-white/95 backdrop-blur-md safe-bottom">
        <div className="grid grid-cols-3 gap-1 p-2">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => onSection(item.id)}
              className={`rounded-xl py-2.5 px-1 text-center touch-manipulation min-h-[52px] ${
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

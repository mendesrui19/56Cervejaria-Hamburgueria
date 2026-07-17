"use client";

import { LogoutButton } from "@/components/LogoutButton";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  action?: React.ReactNode;
  compact?: boolean;
  /** Mostrar Sair à direita (default true). */
  showLogout?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Voltar",
  action,
  compact = false,
  showLogout = true,
}: ScreenHeaderProps) {
  return (
    <header className="staff-header sticky top-0 z-40 border-b border-brand-line bg-white shrink-0">
      <div
        className={`grid grid-cols-[minmax(4.5rem,1fr)_auto_minmax(4.5rem,1fr)] items-center gap-2 ${
          compact ? "px-3 py-2" : "px-3 py-2.5"
        }`}
      >
        <div className="justify-self-start min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="staff-chrome-nav-btn"
            aria-label={backLabel}
          >
            <span aria-hidden="true">←</span>
            <span>{backLabel}</span>
          </button>
        </div>

        <div className="text-center min-w-0 px-1">
          <h1
            className={`font-display font-bold text-brand-gold truncate ${
              compact ? "text-base" : "text-lg"
            }`}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="text-brand-muted text-xs truncate mt-0.5">{subtitle}</p>
          ) : null}
        </div>

        <div className="justify-self-end flex items-center gap-1.5 min-w-0">
          {action}
          {showLogout ? <LogoutButton compact /> : null}
        </div>
      </div>
    </header>
  );
}

interface ScreenPageProps {
  children: React.ReactNode;
  nested?: boolean;
}

export function ScreenPage({ children, nested = false }: ScreenPageProps) {
  return (
    <div
      className={`flex flex-col bg-brand-dark overflow-hidden ${
        nested ? "h-full min-h-0" : "h-full min-h-0 flex-1"
      }`}
    >
      {children}
    </div>
  );
}

interface ScreenBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ScreenBody({ children, className = "" }: ScreenBodyProps) {
  return (
    <main
      className={`flex-1 min-h-0 overflow-y-auto scrollbar-thin ${className}`}
    >
      {children}
    </main>
  );
}

interface ScreenFooterProps {
  children: React.ReactNode;
  compact?: boolean;
}

export function ScreenFooter({ children, compact = false }: ScreenFooterProps) {
  return (
    <footer
      className={`shrink-0 border-t border-brand-line bg-white/95 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      {children}
    </footer>
  );
}

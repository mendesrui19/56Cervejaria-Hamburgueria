"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { StaffFullscreenToggle } from "@/components/StaffFullscreenToggle";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** Link para o hub /sistema (quando não há onBack). */
  hubHref?: string;
  hubLabel?: string;
  /** @deprecated Use hubHref */
  backHref?: string;
  /** Voltar no fluxo interno (substitui o link Sistema à esquerda). */
  onBack?: () => void;
  backLabel?: string;
  /** Acções extra à esquerda do Sair. */
  actions?: React.ReactNode;
  /** Mostrar botão Sair (default true). */
  showLogout?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  hubHref,
  hubLabel = "Sistema",
  backHref,
  onBack,
  backLabel = "Voltar",
  actions,
  showLogout = true,
}: AppHeaderProps) {
  const sistemaHref = hubHref ?? backHref ?? "/sistema";

  return (
    <header className="staff-header sticky top-0 z-50 border-b border-brand-line bg-white/95 backdrop-blur-md">
      <div className="grid grid-cols-[minmax(4.5rem,1fr)_auto_minmax(4.5rem,1fr)] items-center gap-2 px-3 sm:px-4 py-2.5 max-w-7xl mx-auto">
        <div className="justify-self-start min-w-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="staff-chrome-nav-btn"
              aria-label={backLabel}
            >
              <span aria-hidden="true">←</span>
              <span>{backLabel}</span>
            </button>
          ) : (
            <Link
              href={sistemaHref}
              className="staff-chrome-nav-btn"
              aria-label={hubLabel}
            >
              <span aria-hidden="true">←</span>
              <span>{hubLabel}</span>
            </Link>
          )}
        </div>

        <div className="text-center min-w-0 px-1">
          <h1 className="font-display text-base sm:text-lg font-bold text-brand-gold leading-tight truncate">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-brand-muted text-[11px] sm:text-xs truncate mt-0.5">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="justify-self-end flex items-center gap-1.5 min-w-0">
          {actions}
          {showLogout ? <StaffFullscreenToggle /> : null}
          {showLogout ? <LogoutButton compact /> : null}
        </div>
      </div>
    </header>
  );
}

interface SegmentedControlProps {
  options: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function SegmentedControl({
  options,
  active,
  onChange,
}: SegmentedControlProps) {
  return (
    <div className="flex rounded-xl bg-brand-dark border border-brand-line p-1 gap-1 w-full sm:w-auto overflow-x-auto scrollbar-thin">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex-1 sm:flex-none shrink-0 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all min-h-[44px] touch-manipulation ${
            active === opt.id
              ? "bg-brand-gold text-white shadow-sm"
              : "text-brand-muted hover:text-brand-gold hover:bg-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

"use client";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Voltar",
  action,
  compact = false,
}: ScreenHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-line bg-white safe-top shrink-0">
      <div
        className={`flex items-center gap-2 shrink-0 ${
          compact ? "px-3 py-2" : "px-3 py-3"
        }`}
      >
        <button
          onClick={onBack}
          className={`flex items-center justify-center rounded-xl bg-brand-dark border border-brand-line touch-manipulation active:bg-white px-2 ${
            compact ? "min-w-[44px] min-h-[44px]" : "min-w-[52px] min-h-[52px]"
          }`}
        >
          <span className="text-[10px] text-brand-muted font-semibold uppercase tracking-wide">
            {backLabel}
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <h1
            className={`font-display font-bold text-brand-gold truncate ${
              compact ? "text-base" : "text-lg"
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-brand-muted text-xs truncate">{subtitle}</p>
          )}
        </div>
        {action}
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
        nested ? "h-full min-h-0" : "h-dvh"
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
      className={`shrink-0 border-t border-brand-line bg-white/95 safe-bottom ${
        compact ? "p-3" : "p-4"
      }`}
    >
      {children}
    </footer>
  );
}

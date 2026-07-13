import Link from "next/link";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  backHref = "/sistema",
  backLabel,
  onBack,
  actions,
}: AppHeaderProps) {
  const backButtonClass =
    "flex items-center justify-center min-h-[44px] px-2 -ml-1 rounded-xl text-brand-muted hover:text-brand-gold hover:bg-brand-card transition-colors touch-manipulation text-[11px] font-semibold uppercase tracking-wide";

  return (
    <header className="sticky top-0 z-50 border-b border-brand-line bg-white/95 backdrop-blur-md safe-top">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
          {onBack ? (
            <button onClick={onBack} className={backButtonClass} aria-label="Voltar">
              Voltar
            </button>
          ) : (
            <Link href={backHref} className={backButtonClass} aria-label="Início">
              Início
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-xl font-bold text-brand-gold leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-brand-muted text-[11px] sm:text-xs truncate">
                {subtitle}
              </p>
            )}
            {backLabel && (
              <p className="text-brand-muted text-[11px] sm:hidden">{backLabel}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
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
    <div className="flex rounded-xl bg-brand-dark border border-brand-line p-1 gap-1 w-full sm:w-auto">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 sm:flex-none rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all min-h-[44px] touch-manipulation ${
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

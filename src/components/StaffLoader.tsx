"use client";

interface StaffLoaderProps {
  label?: string;
  /** Preenche o ecrã staff (shell) ou só a área de conteúdo */
  fullScreen?: boolean;
  compact?: boolean;
}

/** Loader simples para ecrãs staff (mesas, caixa, cozinha…). */
export function StaffLoader({
  label = "A carregar…",
  fullScreen = false,
  compact = false,
}: StaffLoaderProps) {
  const body = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        compact ? "py-10" : "py-16"
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="staff-loader-spinner" aria-hidden="true" />
      <p className="text-sm font-semibold text-brand-muted">{label}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="staff-shell items-center justify-center bg-brand-dark">
        {body}
      </div>
    );
  }

  return body;
}

interface PageLoaderProps {
  title: string;
}

export function PageLoader({ title }: PageLoaderProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-brand-line bg-white safe-top px-4 py-3">
        <h1 className="font-display text-base font-bold text-brand-gold">
          {title}
        </h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-brand-muted text-sm">A carregar...</p>
      </div>
    </div>
  );
}

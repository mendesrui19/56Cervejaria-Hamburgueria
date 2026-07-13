interface GlovoLogoProps {
  className?: string;
}

export function GlovoLogo({ className = "" }: GlovoLogoProps) {
  return (
    <span className={`glovo-wordmark ${className}`.trim()}>Glovo</span>
  );
}

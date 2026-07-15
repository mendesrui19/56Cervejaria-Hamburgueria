"use client";

import Image from "next/image";

export function LoyaltyLoader({ label = "A carregar…" }: { label?: string }) {
  return (
    <div className="loyalty-app">
      <div className="loyalty-loading" role="status" aria-live="polite">
        <div className="loyalty-loader-mark">
          <Image
            src="/brand/logo.png"
            alt="Cinquenta & Seis"
            width={96}
            height={96}
            priority
            className="loyalty-loader-logo"
          />
          <span className="loyalty-loader-ring" aria-hidden="true" />
        </div>
        <p className="loyalty-loader-label">{label}</p>
      </div>
    </div>
  );
}

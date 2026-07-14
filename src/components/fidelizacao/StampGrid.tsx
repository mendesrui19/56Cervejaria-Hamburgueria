"use client";

import { LOYALTY_STAMPS_TARGET } from "@/lib/loyalty";

export function StampGrid({
  current,
  target = LOYALTY_STAMPS_TARGET,
  pulseIndex,
}: {
  current: number;
  target?: number;
  pulseIndex?: number | null;
}) {
  return (
    <div className="loyalty-stamp-grid">
      {Array.from({ length: target }).map((_, index) => {
        const filled = index < current;
        const pulsing = pulseIndex === index;

        return (
          <div
            key={index}
            className={`loyalty-stamp-slot ${filled ? "is-filled" : ""} ${
              pulsing ? "is-pulsing" : ""
            }`}
            aria-hidden={!filled}
          >
            {filled ? (
              <span className="loyalty-stamp-mark" aria-hidden="true" />
            ) : (
              <span className="loyalty-stamp-empty">{index + 1}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

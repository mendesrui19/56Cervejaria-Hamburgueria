"use client";

import Image from "next/image";
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
            aria-label={filled ? `Selo ${index + 1}` : `Selo ${index + 1} vazio`}
          >
            {filled ? (
              <Image
                src="/brand/selo-stamp.png"
                alt=""
                width={64}
                height={64}
                className="loyalty-stamp-img"
                draggable={false}
              />
            ) : (
              <span className="loyalty-stamp-empty">{index + 1}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

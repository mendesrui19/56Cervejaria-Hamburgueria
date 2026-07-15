"use client";

import { useEffect } from "react";
import { ConfettiBurst } from "@/components/fidelizacao/ConfettiBurst";

export function StampCelebration({
  stampsAdded,
  isBonus,
  rewardUnlocked,
  rewardLabel,
  showConfetti = false,
  onDone,
}: {
  stampsAdded: number;
  isBonus?: boolean;
  rewardUnlocked?: boolean;
  rewardLabel?: string;
  showConfetti?: boolean;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  const confetti = showConfetti || rewardUnlocked || stampsAdded >= 4;

  return (
    <div className="loyalty-celebration" role="dialog" aria-live="polite">
      {confetti && <ConfettiBurst />}
      <div className="loyalty-celebration-burst" />
      <div className="loyalty-celebration-card">
        {rewardUnlocked ? (
          <>
            <div className="loyalty-celebration-icon" aria-hidden="true">
              ✓
            </div>
            <h2 className="font-display text-2xl font-bold text-brand-gold">
              Recompensa desbloqueada
            </h2>
            <p className="mt-2" style={{ color: "#6b5e52" }}>
              {rewardLabel ?? "Nova recompensa disponível"}
            </p>
          </>
        ) : (
          <>
            <div
              className={`loyalty-celebration-icon${isBonus ? " is-bonus" : ""}`}
              aria-hidden="true"
            >
              +
            </div>
            <h2 className="font-display text-2xl font-bold text-brand-gold">
              +{stampsAdded} selo{stampsAdded > 1 ? "s" : ""}
            </h2>
            <p className="mt-2" style={{ color: "#6b5e52" }}>
              {isBonus ? "Desafio mensal activado" : "Obrigado pela visita"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

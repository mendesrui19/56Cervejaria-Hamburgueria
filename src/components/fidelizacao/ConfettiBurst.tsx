"use client";

import { useEffect, useState } from "react";

export function ConfettiBurst() {
  const [pieces] = useState(() =>
    Array.from({ length: 48 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.4}s`,
      duration: `${1.2 + Math.random() * 0.8}s`,
      color: ["#c9a227", "#f5e6a8", "#ffffff", "#8f6814", "#fde68a"][
        i % 5
      ],
      rotate: `${Math.random() * 360}deg`,
    }))
  );

  return (
    <div className="loyalty-confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="loyalty-confetti-piece"
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotate})`,
          }}
        />
      ))}
    </div>
  );
}

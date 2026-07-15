"use client";

import { useState } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function LoyaltyPinPad({
  title,
  subtitle,
  onComplete,
  disabled,
  error,
}: {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => void | Promise<void>;
  disabled?: boolean;
  error?: string;
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(value: string) {
    setLoading(true);
    try {
      await onComplete(value);
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  function handleDigit(digit: string) {
    if (loading || disabled || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      window.setTimeout(() => {
        void submit(next);
      }, 0);
    }
  }

  function handleBackspace() {
    if (loading || disabled) return;
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="loyalty-pin-pad">
      <div className="text-center mb-6">
        <p className="loyalty-pin-title">{title}</p>
        {subtitle && <p className="loyalty-pin-subtitle">{subtitle}</p>}
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`loyalty-pin-dot ${i < pin.length ? "is-filled" : ""}`}
          />
        ))}
      </div>

      {error && <p className="loyalty-error text-center text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-2.5">
        {KEYS.map((key, idx) => {
          if (key === "") return <div key={`pad-${idx}`} aria-hidden="true" />;
          if (key === "del") {
            return (
              <button
                key={`pad-${idx}`}
                type="button"
                onClick={handleBackspace}
                disabled={loading || disabled || pin.length === 0}
                className="loyalty-pin-key loyalty-pin-key-muted"
              >
                Apagar
              </button>
            );
          }
          return (
            <button
              key={`pad-${idx}`}
              type="button"
              onClick={() => handleDigit(key)}
              disabled={loading || disabled}
              className="loyalty-pin-key"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LoyaltyPinPadControlled({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  label?: string;
}) {
  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

  function handleDigit(digit: string) {
    if (value.length >= 4) return;
    onChange(value + digit);
  }

  return (
    <div>
      {label && <p className="loyalty-pin-subtitle mb-3">{label}</p>}
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`loyalty-pin-dot loyalty-pin-dot-sm ${i < value.length ? "is-filled" : ""}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key, idx) => {
          if (key === "") return <div key={`cpad-${idx}`} aria-hidden="true" />;
          if (key === "del") {
            return (
              <button
                key={`cpad-${idx}`}
                type="button"
                onClick={() => onChange(value.slice(0, -1))}
                disabled={value.length === 0}
                className="loyalty-pin-key loyalty-pin-key-sm loyalty-pin-key-muted"
              >
                Apagar
              </button>
            );
          }
          return (
            <button
              key={`cpad-${idx}`}
              type="button"
              onClick={() => handleDigit(key)}
              disabled={value.length >= 4}
              className="loyalty-pin-key loyalty-pin-key-sm"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

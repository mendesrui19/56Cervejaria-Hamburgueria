"use client";

import { useCallback, useState } from "react";

interface PinScreenProps {
  title?: string;
  subtitle?: string;
  dest?: string;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function PinScreen({
  title = "Acesso Staff",
  subtitle = "Introduza o PIN de 4 dígitos",
  dest = "/",
}: PinScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitPin = useCallback(
    async (value: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/auth/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ pin: value }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "PIN incorreto");
        }

        const target =
          dest.startsWith("/") && !dest.startsWith("//") ? dest : "/sistema";
        window.location.assign(target);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao validar PIN");
        setPin("");
      } finally {
        setLoading(false);
      }
    },
    [dest]
  );

  function handleDigit(digit: string) {
    if (loading || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError("");
    if (next.length === 4) {
      void submitPin(next);
    }
  }

  function handleBackspace() {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
    setError("");
  }

  return (
    <div className="staff-safe-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-brand-gold text-xs font-semibold tracking-widest uppercase mb-2">
            Cinquenta & Seis
          </p>
          <h1 className="font-display text-2xl font-bold text-brand-gold mb-2">
            {title}
          </h1>
          <p className="text-brand-muted text-sm">{subtitle}</p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < pin.length
                  ? "bg-brand-gold border-brand-gold"
                  : "border-brand-gold/30 bg-transparent"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-red-700 text-sm font-semibold mb-4">
            {error}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((key, idx) => {
            const cellKey = `pin-cell-${idx}`;

            if (key === "") {
              return <div key={cellKey} aria-hidden="true" />;
            }

            if (key === "del") {
              return (
                <button
                  key={cellKey}
                  type="button"
                  onClick={handleBackspace}
                  disabled={loading || pin.length === 0}
                  className="rounded-2xl min-h-[64px] bg-white border border-brand-line text-brand-muted font-semibold text-sm touch-manipulation active:bg-brand-dark disabled:opacity-40"
                >
                  Apagar
                </button>
              );
            }

            return (
              <button
                key={cellKey}
                type="button"
                onClick={() => handleDigit(key)}
                disabled={loading}
                className="rounded-2xl min-h-[64px] bg-white border border-brand-line text-brand-gold font-black text-2xl touch-manipulation active:bg-amber-50 disabled:opacity-40"
              >
                {key}
              </button>
            );
          })}
        </div>

        {loading && (
          <p className="text-center text-brand-muted text-sm mt-6">
            A validar…
          </p>
        )}
      </div>
    </div>
  );
}

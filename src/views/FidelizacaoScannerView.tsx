"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { StampCelebration } from "@/components/fidelizacao/StampCelebration";
import { StampGrid } from "@/components/fidelizacao/StampGrid";
import { parseLoyaltyQrPayload } from "@/lib/loyalty";
import type { LoyaltyMemberProfile, LoyaltyStampResult } from "@/lib/loyalty";
import { addLoyaltyStampStaff, lookupLoyaltyMember } from "@/lib/loyalty-api";

export default function FidelizacaoScannerView() {
  const [code, setCode] = useState("");
  const [member, setMember] = useState<LoyaltyMemberProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<LoyaltyStampResult | null>(null);
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);

  const lookup = useCallback(async (raw: string) => {
    const parsed = parseLoyaltyQrPayload(raw) ?? raw.trim().toUpperCase();
    if (!parsed) return;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const profile = await lookupLoyaltyMember(parsed);
      setMember(profile);
      setCode(parsed);
    } catch (e) {
      setMember(null);
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!scanning) {
      void scannerRef.current?.clear().catch(() => {});
      scannerRef.current = null;
      return;
    }

    let cancelled = false;

    void import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (cancelled) return;

      const scanner = new Html5QrcodeScanner(
        "loyalty-qr-reader",
        { fps: 8, qrbox: { width: 240, height: 240 } },
        false
      );

      scanner.render(
        (decoded) => {
          void lookup(decoded);
          setScanning(false);
        },
        () => {}
      );

      scannerRef.current = scanner;
    });

    return () => {
      cancelled = true;
      void scannerRef.current?.clear().catch(() => {});
    };
  }, [scanning, lookup]);

  async function handleAddStamp() {
    if (!member) return;
    setAdding(true);
    setError("");
    try {
      const stampResult = await addLoyaltyStampStaff({
        memberCode: member.memberCode,
        addedBy: "Caixa",
      });
      setMember(stampResult.member);
      setResult(stampResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="staff-safe-screen min-h-dvh bg-brand-dark">
      {result && (
        <StampCelebration
          stampsAdded={result.stampsAdded}
          isBonus={result.isBonus}
          rewardUnlocked={result.rewardUnlocked}
          onDone={() => setResult(null)}
        />
      )}

      <header className="sticky top-0 z-30 border-b border-brand-line bg-white safe-top px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link
              href="/sistema"
              className="text-xs text-brand-muted hover:text-brand-gold"
            >
              ← Início
            </Link>
            <h1 className="font-display text-xl font-bold text-brand-gold mt-1">
              Fidelização — Caixa
            </h1>
            <p className="text-xs text-brand-muted">Ler QR ou código do cliente</p>
          </div>
          <LogoutButton compact />
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        <div className="card space-y-3">
          <label className="text-sm font-bold text-brand-gold block">
            Código do cliente
          </label>
          <div className="flex gap-2">
            <input
              className="input flex-1 uppercase"
              placeholder="CS4F2A9"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") void lookup(code);
              }}
            />
            <button
              type="button"
              onClick={() => void lookup(code)}
              disabled={loading || !code.trim()}
              className="btn-secondary shrink-0"
            >
              {loading ? "…" : "Buscar"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setScanning((v) => !v)}
            className="btn-primary w-full"
          >
            {scanning ? "Fechar câmara" : "Ler QR Code"}
          </button>
          {scanning && (
            <div
              id="loyalty-qr-reader"
              className="rounded-xl overflow-hidden border border-brand-line"
            />
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center font-semibold">{error}</p>
        )}

        {member && (
          <div className="card space-y-4 border-brand-gold/30">
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-muted font-bold">
                Cliente
              </p>
              <h2 className="text-2xl font-black text-brand-gold">{member.name}</h2>
            <p className="text-sm text-brand-muted mt-1">
              {member.memberCode} · {member.level.label} · {member.mealsThisMonth}{" "}
              visitas/mês · racha {member.streakWeeks}/{member.streakTarget}
            </p>
            </div>

            <div className="loyalty-staff-preview">
              <StampGrid current={member.currentStamps} target={member.stampsTarget} />
            </div>

            {member.bonusEligible && (
              <div className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 text-sm text-amber-950 font-semibold">
                Bónus activo: esta visita dá +{member.bonusStamps} selos
              </div>
            )}

            {member.availableRewards > 0 && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-3 text-sm text-emerald-900 font-semibold">
                {member.availableRewards} recompensa
                {member.availableRewards > 1 ? "s" : ""} por usar
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleAddStamp()}
              disabled={adding}
              className="btn-primary w-full text-lg py-4 min-h-[56px]"
            >
              {adding ? "A registar…" : "Adicionar selo / refeição"}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-brand-muted leading-relaxed px-2">
          Lê o QR do cliente na app de fidelização para registar a visita e
          atribuir selos.
        </p>
      </main>
    </div>
  );
}

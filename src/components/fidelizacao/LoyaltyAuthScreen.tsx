"use client";

import Image from "next/image";
import { useState } from "react";
import { LoyaltyPinPad } from "@/components/fidelizacao/LoyaltyPinPad";
import {
  loginLoyaltyClient,
  registerLoyaltyClient,
} from "@/lib/loyalty-api";
import type { LoyaltyMemberProfile } from "@/lib/loyalty";

type AuthMode = "login" | "register";

export function LoyaltyAuthScreen({
  referralCode,
  onAuthenticated,
}: {
  referralCode?: string;
  onAuthenticated: (member: LoyaltyMemberProfile) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [registerPin, setRegisterPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [registerStep, setRegisterStep] = useState<"form" | "pin" | "confirm">(
    "form"
  );

  async function handleLogin(pin: string) {
    setError("");
    setLoading(true);
    try {
      const member = await loginLoyaltyClient({ phone, pin });
      onAuthenticated(member);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function finishRegister() {
    setError("");
    setLoading(true);
    try {
      const member = await registerLoyaltyClient({
        name,
        phone,
        birthDate,
        pin: registerPin,
        referredByCode: referralCode,
      });
      onAuthenticated(member);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setRegisterStep("pin");
      setConfirmPin("");
    } finally {
      setLoading(false);
    }
  }

  function startRegisterPin() {
    if (!name.trim()) {
      setError("Nome obrigatório");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      setError("Telemóvel inválido");
      return;
    }
    if (!birthDate) {
      setError("Data de nascimento obrigatória");
      return;
    }
    setError("");
    setRegisterStep("pin");
  }

  function handleRegisterPin(pin: string) {
    setRegisterPin(pin);
    setRegisterStep("confirm");
  }

  function handleConfirmPin(pin: string) {
    if (pin !== registerPin) {
      setError("Os PINs não coincidem");
      setConfirmPin("");
      setRegisterStep("pin");
      setRegisterPin("");
      return;
    }
    void finishRegister();
  }

  return (
    <div className="loyalty-app">
      <div className="loyalty-shell loyalty-shell-auth">
        <header className="loyalty-brand-head">
          <Image
            src="/brand/logo.png"
            alt="Cinquenta & Seis"
            width={72}
            height={72}
            priority
            className="loyalty-brand-logo"
          />
          <p className="loyalty-brand-kicker">Cinquenta & Seis</p>
          <h1 className="loyalty-brand-title">App 56</h1>
          <p className="loyalty-brand-sub">
            Junta selos, desbloqueia recompensas e acompanha os teus desafios.
          </p>
        </header>

        {referralCode && mode === "register" && registerStep === "form" && (
          <div className="loyalty-bonus-banner">
            Convite {referralCode} — bónus na primeira visita
          </div>
        )}

        <div className="loyalty-auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
              setRegisterStep("form");
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === "register" ? "is-active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Criar cartão
          </button>
        </div>

        {mode === "login" ? (
          <div className="loyalty-auth-panel">
            <input
              className="loyalty-input"
              placeholder="Telemóvel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
            <LoyaltyPinPad
              title="PIN de acesso"
              subtitle="4 dígitos definidos no registo"
              onComplete={handleLogin}
              disabled={loading || phone.replace(/\D/g, "").length < 9}
              error={error}
            />
          </div>
        ) : registerStep === "form" ? (
          <div className="loyalty-auth-panel space-y-4">
            <input
              className="loyalty-input"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <input
              className="loyalty-input"
              placeholder="Telemóvel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
            <label className="block">
              <span className="loyalty-field-label">
                Data de nascimento (definitiva)
              </span>
              <input
                className="loyalty-input"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </label>
            {error && <p className="loyalty-error text-sm">{error}</p>}
            <button
              type="button"
              onClick={startRegisterPin}
              className="loyalty-btn-primary w-full"
            >
              Continuar
            </button>
          </div>
        ) : registerStep === "pin" ? (
          <div className="loyalty-auth-panel">
            <LoyaltyPinPad
              title="Escolhe o teu PIN"
              subtitle="4 dígitos — podes alterar depois no perfil"
              onComplete={handleRegisterPin}
              disabled={loading}
              error={error}
            />
            <button
              type="button"
              onClick={() => setRegisterStep("form")}
              className="loyalty-btn-text w-full mt-4"
            >
              Voltar
            </button>
          </div>
        ) : (
          <div className="loyalty-auth-panel">
            <LoyaltyPinPad
              title="Confirma o PIN"
              subtitle="Repete os 4 dígitos"
              onComplete={handleConfirmPin}
              disabled={loading}
              error={error}
            />
            <button
              type="button"
              onClick={() => {
                setRegisterStep("pin");
                setRegisterPin("");
              }}
              className="loyalty-btn-text w-full mt-4"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { LoyaltyAvatar } from "@/components/fidelizacao/LoyaltyAvatar";
import { LoyaltyPinPadControlled } from "@/components/fidelizacao/LoyaltyPinPad";
import { updateLoyaltyProfile } from "@/lib/loyalty-api";
import type { LoyaltyMemberProfile } from "@/lib/loyalty";

function formatBirthDate(value?: string) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function LoyaltyProfileTab({
  member,
  onUpdated,
  onLogout,
}: {
  member: LoyaltyMemberProfile;
  onUpdated: (member: LoyaltyMemberProfile) => void;
  onLogout: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  async function saveProfile(patch: {
    name?: string;
    phone?: string;
    avatarUrl?: string | null;
    pin?: string;
    currentPin?: string;
  }) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateLoyaltyProfile(patch);
      onUpdated(updated);
      setName(updated.name);
      setPhone(updated.phone ?? "");
      setSuccess("Alterações guardadas");
      setShowPinChange(false);
      setCurrentPin("");
      setNewPin("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Escolhe uma imagem");
      return;
    }
    if (file.size > 220_000) {
      setError("Imagem demasiado grande (máx. 200 KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        void saveProfile({ avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    await saveProfile({ name, phone });
  }

  async function handleSavePin() {
    if (newPin.length !== 4) {
      setError("PIN novo deve ter 4 dígitos");
      return;
    }
    await saveProfile({ pin: newPin, currentPin });
  }

  async function shareInvite() {
    const text = `Junta-te ao cartão Cinquenta & Seis: ${member.inviteUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Cartão Cinquenta & Seis",
          text,
          url: member.inviteUrl,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(member.inviteUrl);
    setSuccess("Link copiado");
  }

  return (
    <div className="loyalty-tab-panel">
      <section className="loyalty-profile-hero">
        <LoyaltyAvatar
          member={member}
          size="lg"
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarPick}
        />
        <h2 className="loyalty-profile-name">{member.name}</h2>
        <p className="loyalty-profile-code">{member.memberCode}</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="loyalty-btn-text"
        >
          Alterar foto
        </button>
      </section>

      <form onSubmit={handleSaveDetails} className="loyalty-profile-form">
        <p className="loyalty-section-kicker">Os teus dados</p>

        <label className="loyalty-field">
          <span className="loyalty-field-label">Nome</span>
          <input
            className="loyalty-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="loyalty-field">
          <span className="loyalty-field-label">Telemóvel</span>
          <input
            className="loyalty-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            required
          />
        </label>

        <div className="loyalty-field">
          <span className="loyalty-field-label">Data de nascimento</span>
          <div className="loyalty-readonly-field">
            {formatBirthDate(member.birthDate)}
          </div>
          {member.birthDateLocked && (
            <p className="loyalty-field-hint">
              Definida no registo — não pode ser alterada
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="loyalty-btn-primary w-full"
        >
          {saving ? "A guardar…" : "Guardar dados"}
        </button>
      </form>

      <section className="loyalty-profile-block">
        <div className="loyalty-section-head">
          <div>
            <p className="loyalty-section-kicker">Segurança</p>
            <h3 className="loyalty-section-title">PIN de acesso</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowPinChange((v) => !v)}
            className="loyalty-btn-ghost"
          >
            {showPinChange ? "Fechar" : "Alterar"}
          </button>
        </div>

        {showPinChange && (
          <div className="loyalty-pin-change">
            <LoyaltyPinPadControlled
              label="PIN actual"
              value={currentPin}
              onChange={setCurrentPin}
            />
            <div className="mt-4">
              <LoyaltyPinPadControlled
                label="PIN novo"
                value={newPin}
                onChange={setNewPin}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSavePin()}
              disabled={saving || currentPin.length < 4 || newPin.length < 4}
              className="loyalty-btn-primary w-full mt-4"
            >
              Guardar PIN
            </button>
          </div>
        )}
      </section>

      <section className="loyalty-profile-block">
        <button
          type="button"
          onClick={() => void shareInvite()}
          className="loyalty-btn-secondary w-full"
        >
          Convida um amigo (+1 selo para ambos)
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="loyalty-btn-text w-full mt-3"
        >
          Terminar sessão
        </button>
      </section>

      {error && <p className="text-red-300 text-sm text-center">{error}</p>}
      {success && <p className="text-emerald-300 text-sm text-center">{success}</p>}
    </div>
  );
}

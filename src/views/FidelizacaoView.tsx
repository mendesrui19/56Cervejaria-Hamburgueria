"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoyaltyAuthScreen } from "@/components/fidelizacao/LoyaltyAuthScreen";
import { LoyaltyCardTab } from "@/components/fidelizacao/LoyaltyCardTab";
import { LoyaltyProfileTab } from "@/components/fidelizacao/LoyaltyProfileTab";
import { LoyaltyQrTab } from "@/components/fidelizacao/LoyaltyQrTab";
import { StampCelebration } from "@/components/fidelizacao/StampCelebration";
import type { LoyaltyMemberProfile } from "@/lib/loyalty";
import {
  fetchLoyaltySession,
  logoutLoyaltyClient,
  redeemLoyaltyClient,
} from "@/lib/loyalty-api";

type LoyaltyTab = "card" | "qr" | "profile";

export default function FidelizacaoView() {
  const [member, setMember] = useState<LoyaltyMemberProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [tab, setTab] = useState<LoyaltyTab>("card");
  const [celebration, setCelebration] = useState<{
    stampsAdded: number;
    isBonus: boolean;
    rewardUnlocked: boolean;
    rewardLabel?: string;
  } | null>(null);
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);

  const prevStamps = useRef<number | null>(null);
  const prevRewards = useRef<number | null>(null);

  const applyMember = useCallback((profile: LoyaltyMemberProfile, silent = false) => {
    if (prevStamps.current !== null && profile.currentStamps !== prevStamps.current) {
      const added =
        profile.currentStamps >= prevStamps.current
          ? profile.currentStamps - prevStamps.current
          : profile.currentStamps +
            (profile.stampsTarget - prevStamps.current);

      const rewardUnlocked =
        prevRewards.current !== null &&
        profile.availableRewards > prevRewards.current;

      const lastEvent = profile.recentEvents[0];
      const newestReward = profile.rewards.find((r) => !r.redeemedAt);

      setCelebration({
        stampsAdded: lastEvent?.stampsAdded ?? added,
        isBonus: lastEvent?.isBonus ?? false,
        rewardUnlocked: Boolean(rewardUnlocked),
        rewardLabel: rewardUnlocked ? newestReward?.label : undefined,
      });
      setPulseIndex(Math.min(profile.currentStamps - 1, profile.stampsTarget - 1));
      window.setTimeout(() => setPulseIndex(null), 1200);
    }

    prevStamps.current = profile.currentStamps;
    prevRewards.current = profile.availableRewards;
    setMember(profile);
    if (!silent) setError("");
  }, []);

  const refreshSession = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const profile = await fetchLoyaltySession();
        if (profile) {
          applyMember(profile, silent);
        } else {
          setMember(null);
          prevStamps.current = null;
          prevRewards.current = null;
        }
      } catch (e) {
        if (!silent) {
          setError(e instanceof Error ? e.message : "Erro");
          setMember(null);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [applyMember]
  );

  useEffect(() => {
    setHydrated(true);
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!member) return;
    const id = window.setInterval(() => {
      void refreshSession(true);
    }, 4000);
    return () => window.clearInterval(id);
  }, [member, refreshSession]);

  async function handleRedeem(rewardId: number) {
    if (!member) return;
    if (!window.confirm("Usar esta recompensa agora na caixa?")) return;
    try {
      const updated = await redeemLoyaltyClient(rewardId);
      applyMember(updated, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleLogout() {
    await logoutLoyaltyClient();
    setMember(null);
    setTab("card");
    prevStamps.current = null;
    prevRewards.current = null;
  }

  if (!hydrated || loading) {
    return (
      <div className="loyalty-app">
        <div className="loyalty-loading">A carregar…</div>
      </div>
    );
  }

  if (!member) {
    return (
      <LoyaltyAuthScreen
        referralCode={referralCode || undefined}
        onAuthenticated={(profile) => {
          prevStamps.current = profile.currentStamps;
          prevRewards.current = profile.availableRewards;
          setMember(profile);
        }}
      />
    );
  }

  return (
    <div className="loyalty-app">
      {celebration && (
        <StampCelebration
          stampsAdded={celebration.stampsAdded}
          isBonus={celebration.isBonus}
          rewardUnlocked={celebration.rewardUnlocked}
          rewardLabel={celebration.rewardLabel}
          onDone={() => setCelebration(null)}
        />
      )}

      <div className="loyalty-shell loyalty-shell-app">
        <header className="loyalty-app-topbar">
          <div>
            <p className="loyalty-app-topbar-kicker">Cinquenta & Seis</p>
            <p className="loyalty-app-topbar-title">Fidelização</p>
          </div>
          <span className="loyalty-level-badge loyalty-level-badge-compact">
            {member.level.label}
          </span>
        </header>

        <main className="loyalty-app-main">
          {tab === "card" && (
            <LoyaltyCardTab
              member={member}
              pulseIndex={pulseIndex}
              onOpenQr={() => setTab("qr")}
              onRedeem={(id) => void handleRedeem(id)}
            />
          )}
          {tab === "qr" && <LoyaltyQrTab member={member} />}
          {tab === "profile" && (
            <LoyaltyProfileTab
              member={member}
              onUpdated={(profile) => applyMember(profile, true)}
              onLogout={() => void handleLogout()}
            />
          )}
          {error && <p className="text-red-300 text-sm text-center mt-4">{error}</p>}
        </main>

        <nav className="loyalty-bottom-nav safe-bottom" aria-label="Navegação">
          <button
            type="button"
            className={tab === "card" ? "is-active" : ""}
            onClick={() => setTab("card")}
          >
            Cartão
          </button>
          <button
            type="button"
            className={`loyalty-bottom-nav-qr ${tab === "qr" ? "is-active" : ""}`}
            onClick={() => setTab("qr")}
          >
            QR
          </button>
          <button
            type="button"
            className={tab === "profile" ? "is-active" : ""}
            onClick={() => setTab("profile")}
          >
            Perfil
          </button>
        </nav>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LoyaltyAuthScreen } from "@/components/fidelizacao/LoyaltyAuthScreen";
import { LoyaltyCardTab } from "@/components/fidelizacao/LoyaltyCardTab";
import { LoyaltyChallengesTab } from "@/components/fidelizacao/LoyaltyChallengesTab";
import { LoyaltyLoader } from "@/components/fidelizacao/LoyaltyLoader";
import { LoyaltyProfileTab } from "@/components/fidelizacao/LoyaltyProfileTab";
import { LoyaltyQrTab } from "@/components/fidelizacao/LoyaltyQrTab";
import { StampCelebration } from "@/components/fidelizacao/StampCelebration";
import type { LoyaltyMemberProfile } from "@/lib/loyalty";
import {
  fetchLoyaltySession,
  logoutLoyaltyClient,
  redeemLoyaltyClient,
} from "@/lib/loyalty-api";

type LoyaltyTab = "card" | "challenges" | "qr" | "profile";

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
    return <LoyaltyLoader label="A preparar o teu cartão…" />;
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
          <div className="loyalty-app-topbar-brand">
            <Image
              src="/brand/logo.png"
              alt=""
              width={36}
              height={36}
              className="loyalty-app-topbar-logo"
            />
            <div>
              <p className="loyalty-app-topbar-kicker">Cinquenta & Seis</p>
              <p className="loyalty-app-topbar-title">App 56</p>
            </div>
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
              onOpenChallenges={() => setTab("challenges")}
              onRedeem={(id) => void handleRedeem(id)}
            />
          )}
          {tab === "challenges" && <LoyaltyChallengesTab member={member} />}
          {tab === "qr" && <LoyaltyQrTab member={member} />}
          {tab === "profile" && (
            <LoyaltyProfileTab
              member={member}
              onUpdated={(profile) => applyMember(profile, true)}
              onLogout={() => void handleLogout()}
            />
          )}
          {error && <p className="loyalty-error text-center mt-4">{error}</p>}
        </main>

        <nav className="loyalty-bottom-nav safe-bottom" aria-label="Navegação">
          <button
            type="button"
            className={tab === "card" ? "is-active" : ""}
            onClick={() => setTab("card")}
          >
            <span className="loyalty-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <circle cx="8.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
                <circle cx="15.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="loyalty-nav-label">Cartão</span>
          </button>
          <button
            type="button"
            className={tab === "challenges" ? "is-active" : ""}
            onClick={() => setTab("challenges")}
          >
            <span className="loyalty-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 21h8" />
                <path d="M12 17v4" />
                <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
                <path d="M7 6H5a2 2 0 0 0 2 2" />
                <path d="M17 6h2a2 2 0 0 1-2 2" />
              </svg>
            </span>
            <span className="loyalty-nav-label">Desafios</span>
          </button>
          <button
            type="button"
            className={tab === "qr" ? "is-active" : ""}
            onClick={() => setTab("qr")}
          >
            <span className="loyalty-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1.2" />
                <rect x="14" y="3" width="7" height="7" rx="1.2" />
                <rect x="3" y="14" width="7" height="7" rx="1.2" />
                <path d="M14 14h3v3" />
                <path d="M21 14v7h-7" />
                <path d="M17 21v-4h4" />
              </svg>
            </span>
            <span className="loyalty-nav-label">QR</span>
          </button>
          <button
            type="button"
            className={tab === "profile" ? "is-active" : ""}
            onClick={() => setTab("profile")}
          >
            <span className="loyalty-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
              </svg>
            </span>
            <span className="loyalty-nav-label">Perfil</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

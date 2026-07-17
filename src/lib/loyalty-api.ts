import type {
  LoyaltyAdminStats,
  LoyaltyMemberProfile,
  LoyaltyStampResult,
} from "@/lib/loyalty";

const CLIENT_FETCH: RequestInit = { credentials: "include" };
const STAFF_FETCH: RequestInit = { credentials: "include" };

export async function registerLoyaltyClient(input: {
  name: string;
  phone: string;
  birthDate: string;
  pin: string;
  referredByCode?: string;
}): Promise<LoyaltyMemberProfile> {
  const res = await fetch("/api/public/loyalty/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...CLIENT_FETCH,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao criar cartão");
  }
  return res.json();
}

export async function loginLoyaltyClient(input: {
  phone: string;
  pin: string;
}): Promise<LoyaltyMemberProfile> {
  const res = await fetch("/api/public/loyalty/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...CLIENT_FETCH,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao iniciar sessão");
  }
  return res.json();
}

export async function logoutLoyaltyClient(): Promise<void> {
  await fetch("/api/public/loyalty/login", {
    method: "DELETE",
    ...CLIENT_FETCH,
  });
}

export async function fetchLoyaltySession(): Promise<LoyaltyMemberProfile | null> {
  const res = await fetch("/api/public/loyalty/session", {
    ...CLIENT_FETCH,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao carregar cartão");
  }
  const data = (await res.json()) as { member: LoyaltyMemberProfile | null };
  return data.member ?? null;
}

export async function updateLoyaltyProfile(input: {
  name?: string;
  phone?: string;
  avatarUrl?: string | null;
  pin?: string;
  currentPin?: string;
}): Promise<LoyaltyMemberProfile> {
  const res = await fetch("/api/public/loyalty/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    ...CLIENT_FETCH,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao guardar perfil");
  }
  return res.json();
}

export async function redeemLoyaltyClient(
  rewardId: number
): Promise<LoyaltyMemberProfile> {
  const res = await fetch("/api/public/loyalty/rewards/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...CLIENT_FETCH,
    body: JSON.stringify({ rewardId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao usar recompensa");
  }
  return res.json();
}

export async function lookupLoyaltyMember(
  code: string
): Promise<LoyaltyMemberProfile> {
  const res = await fetch(
    `/api/loyalty/stamp?code=${encodeURIComponent(code)}`,
    { ...STAFF_FETCH, cache: "no-store" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Cliente não encontrado");
  }
  return res.json();
}

export async function addLoyaltyStampStaff(input: {
  memberCode: string;
  addedBy?: string;
}): Promise<LoyaltyStampResult> {
  const res = await fetch("/api/loyalty/stamp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...STAFF_FETCH,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao adicionar selo");
  }
  return res.json();
}

export async function fetchAdminLoyaltyStats(): Promise<LoyaltyAdminStats> {
  const res = await fetch("/api/gestor56/loyalty/stats", {
    ...STAFF_FETCH,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao carregar App 56");
  }
  return res.json();
}

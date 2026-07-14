export const LOYALTY_STAMPS_TARGET = 10;
export const LOYALTY_REWARD_LABEL = "Entrada grátis";
export const LOYALTY_MONTHLY_MEALS_FOR_BONUS = 5;
export const LOYALTY_BONUS_STAMPS = 4;
export const LOYALTY_STREAK_WEEKS = 3;
export const LOYALTY_REFERRAL_STAMPS = 1;

export const LOYALTY_QR_PREFIX = "CS56:";

export type LoyaltyRewardType =
  | "entrada"
  | "hamburguer"
  | "cerveja_petisco"
  | "aniversario"
  | "referencia";

export type LoyaltyLevelId = "bronze" | "prata" | "ouro";

export const LOYALTY_MILESTONES = [
  { lifetimeStamps: 10, type: "entrada" as const, label: "Entrada grátis" },
  { lifetimeStamps: 20, type: "hamburguer" as const, label: "Hambúrguer grátis" },
  {
    lifetimeStamps: 30,
    type: "cerveja_petisco" as const,
    label: "Cerveja + petisco",
  },
] as const;

export const LOYALTY_LEVELS: Array<{
  id: LoyaltyLevelId;
  minVisits: number;
  label: string;
}> = [
  { id: "bronze", minVisits: 0, label: "Bronze" },
  { id: "prata", minVisits: 10, label: "Prata" },
  { id: "ouro", minVisits: 25, label: "Ouro" },
];

export interface LoyaltyRewardRow {
  id: number;
  type: LoyaltyRewardType;
  label: string;
  unlockedAt: string;
  redeemedAt?: string;
}

export interface LoyaltyStampEventRow {
  id: number;
  stampsAdded: number;
  isBonus: boolean;
  rewardUnlocked: boolean;
  reason?: string;
  createdAt: string;
}

export interface LoyaltyTierProgress {
  lifetimeStamps: number;
  target: number;
  type: LoyaltyRewardType;
  label: string;
  reached: boolean;
}

export interface LoyaltyMemberProfile {
  id: string;
  name: string;
  phone?: string;
  birthDate?: string;
  birthDateLocked: boolean;
  avatarUrl?: string;
  memberCode: string;
  currentStamps: number;
  stampsTarget: number;
  lifetimeStamps: number;
  totalVisits: number;
  lastVisitAt?: string;
  level: { id: LoyaltyLevelId; label: string };
  mealsThisMonth: number;
  bonusEligible: boolean;
  bonusStamps: number;
  streakWeeks: number;
  streakTarget: number;
  streakEligible: boolean;
  birthdayActive: boolean;
  inviteUrl: string;
  tierProgress: LoyaltyTierProgress[];
  availableRewards: number;
  rewards: LoyaltyRewardRow[];
  recentEvents: LoyaltyStampEventRow[];
}

export interface LoyaltyAdminStats {
  totalMembers: number;
  newMembersWeek: number;
  newMembersMonth: number;
  stampsToday: number;
  stampsWeek: number;
  rewardsAvailable: number;
  rewardsRedeemedMonth: number;
  activeMembers30d: number;
  recentMembers: Array<{
    id: string;
    name: string;
    phone?: string;
    memberCode: string;
    totalVisits: number;
    lifetimeStamps: number;
    createdAt: string;
    lastVisitAt?: string;
  }>;
}

export interface LoyaltyStampResult {
  member: LoyaltyMemberProfile;
  stampsAdded: number;
  isBonus: boolean;
  rewardUnlocked: boolean;
  message: string;
}

export function loyaltyQrPayload(memberCode: string) {
  return `${LOYALTY_QR_PREFIX}${memberCode}`;
}

export function parseLoyaltyQrPayload(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed.startsWith(LOYALTY_QR_PREFIX)) {
    return trimmed.slice(LOYALTY_QR_PREFIX.length);
  }
  if (/^CS[A-Z0-9]{6,8}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function currentMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getIsoWeekKey(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function rewardLabelForType(type: LoyaltyRewardType): string {
  const found = LOYALTY_MILESTONES.find((m) => m.type === type);
  if (found) return found.label;
  if (type === "aniversario") return "Entrada grátis (aniversário)";
  if (type === "referencia") return "Selo bónus (convite)";
  return "Recompensa";
}

export function levelForVisits(visits: number) {
  let level = LOYALTY_LEVELS[0]!;
  for (const entry of LOYALTY_LEVELS) {
    if (visits >= entry.minVisits) level = entry;
  }
  return level;
}

export function buildTierProgress(lifetimeStamps: number): LoyaltyTierProgress[] {
  return LOYALTY_MILESTONES.map((m) => ({
    lifetimeStamps,
    target: m.lifetimeStamps,
    type: m.type,
    label: m.label,
    reached: lifetimeStamps >= m.lifetimeStamps,
  }));
}

export function isBirthdayMonth(birthDate?: string | null, now = new Date()) {
  if (!birthDate) return false;
  const [, month] = birthDate.split("-");
  if (!month) return false;
  return parseInt(month, 10) === now.getMonth() + 1;
}

export function countConsecutiveWeeks(weekKeys: string[], fromWeek: string) {
  const set = new Set(weekKeys);
  if (!set.has(fromWeek)) return 0;

  let count = 0;
  let cursor = fromWeek;

  while (set.has(cursor)) {
    count += 1;
    cursor = previousWeekKey(cursor);
  }
  return count;
}

function previousWeekKey(key: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) return key;
  let year = parseInt(match[1]!, 10);
  let week = parseInt(match[2]!, 10) - 1;
  if (week < 1) {
    year -= 1;
    week = 52;
  }
  return `${year}-W${String(week).padStart(2, "0")}`;
}

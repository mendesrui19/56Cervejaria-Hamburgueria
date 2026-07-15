import { and, desc, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db/client";
import {
  loyaltyMembers,
  loyaltyRewards,
  loyaltyStampEvents,
} from "@/db/schema";
import {
  buildTierProgress,
  countConsecutiveWeeks,
  currentMonthKey,
  getIsoWeekKey,
  levelForVisits,
  LOYALTY_BONUS_STAMPS,
  LOYALTY_MILESTONES,
  LOYALTY_MONTHLY_MEALS_FOR_BONUS,
  LOYALTY_REFERRAL_STAMPS,
  LOYALTY_STAMPS_TARGET,
  LOYALTY_STREAK_WEEKS,
  rewardLabelForType,
  type LoyaltyAdminStats,
  type LoyaltyMemberProfile,
  type LoyaltyRewardType,
  type LoyaltyStampResult,
} from "./loyalty";
import {
  hashMemberPin,
  normalizePhone,
  validateAvatarDataUrl,
  verifyMemberPin,
} from "./loyalty-auth";

function randomMemberCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CS";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function uniqueMemberCode(): Promise<string> {
  const db = getDb();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = randomMemberCode();
    const [existing] = await db
      .select({ memberCode: loyaltyMembers.memberCode })
      .from(loyaltyMembers)
      .where(eq(loyaltyMembers.memberCode, code))
      .limit(1);
    if (!existing) return code;
  }
  throw new Error("Não foi possível gerar código de membro");
}

function monthStartIso(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

async function countMealsThisMonth(memberId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loyaltyStampEvents)
    .where(
      and(
        eq(loyaltyStampEvents.memberId, memberId),
        gte(loyaltyStampEvents.createdAt, monthStartIso())
      )
    );
  return row?.count ?? 0;
}

async function countTotalVisits(memberId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loyaltyStampEvents)
    .where(eq(loyaltyStampEvents.memberId, memberId));
  return row?.count ?? 0;
}

async function getLastVisitAt(memberId: string): Promise<string | undefined> {
  const db = getDb();
  const [row] = await db
    .select({ createdAt: loyaltyStampEvents.createdAt })
    .from(loyaltyStampEvents)
    .where(eq(loyaltyStampEvents.memberId, memberId))
    .orderBy(desc(loyaltyStampEvents.createdAt))
    .limit(1);
  return row?.createdAt;
}

async function getVisitWeekKeys(memberId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ createdAt: loyaltyStampEvents.createdAt })
    .from(loyaltyStampEvents)
    .where(eq(loyaltyStampEvents.memberId, memberId));

  const weeks = new Set<string>();
  for (const row of rows) {
    weeks.add(getIsoWeekKey(new Date(row.createdAt)));
  }
  return [...weeks];
}

async function countAvailableRewards(memberId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loyaltyRewards)
    .where(
      and(
        eq(loyaltyRewards.memberId, memberId),
        isNull(loyaltyRewards.redeemedAt),
        sql`${loyaltyRewards.rewardType} <> 'aniversario'`
      )
    );
  return row?.count ?? 0;
}

function inviteUrlForCode(memberCode: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.NODE_ENV === "production"
      ? "https://56cervejariahamburgueria.vercel.app"
      : "http://localhost:3056");
  return `${base}/app?ref=${memberCode}`;
}

async function buildProfile(
  memberRow: typeof loyaltyMembers.$inferSelect
): Promise<LoyaltyMemberProfile> {
  const mealsThisMonth = await countMealsThisMonth(memberRow.id);
  const totalVisits = await countTotalVisits(memberRow.id);
  const lastVisitAt = await getLastVisitAt(memberRow.id);
  const visitWeeks = await getVisitWeekKeys(memberRow.id);
  const currentWeek = getIsoWeekKey();
  const streakWeeks = countConsecutiveWeeks(visitWeeks, currentWeek);

  const bonusEligible =
    mealsThisMonth >= LOYALTY_MONTHLY_MEALS_FOR_BONUS &&
    memberRow.bonusClaimedMonth !== currentMonthKey();

  const streakEligible =
    streakWeeks >= LOYALTY_STREAK_WEEKS - 1 &&
    memberRow.streakBonusWeek !== currentWeek;

  const db = getDb();
  const rewards = await db
    .select()
    .from(loyaltyRewards)
    .where(
      and(
        eq(loyaltyRewards.memberId, memberRow.id),
        sql`${loyaltyRewards.rewardType} <> 'aniversario'`
      )
    )
    .orderBy(desc(loyaltyRewards.unlockedAt))
    .limit(15);

  const recentEvents = await db
    .select()
    .from(loyaltyStampEvents)
    .where(eq(loyaltyStampEvents.memberId, memberRow.id))
    .orderBy(desc(loyaltyStampEvents.createdAt))
    .limit(10);

  const level = levelForVisits(totalVisits);

  return {
    id: memberRow.id,
    name: memberRow.name,
    phone: memberRow.phone ?? undefined,
    birthDate: memberRow.birthDate ?? undefined,
    birthDateLocked: Boolean(memberRow.birthDate),
    avatarUrl: memberRow.avatarUrl ?? undefined,
    memberCode: memberRow.memberCode,
    currentStamps: memberRow.currentStamps,
    stampsTarget: LOYALTY_STAMPS_TARGET,
    lifetimeStamps: memberRow.lifetimeStamps,
    totalVisits,
    lastVisitAt,
    level: { id: level.id, label: level.label },
    mealsThisMonth,
    bonusEligible,
    bonusStamps: LOYALTY_BONUS_STAMPS,
    streakWeeks,
    streakTarget: LOYALTY_STREAK_WEEKS,
    streakEligible,
    inviteUrl: inviteUrlForCode(memberRow.memberCode),
    tierProgress: buildTierProgress(memberRow.lifetimeStamps),
    availableRewards: await countAvailableRewards(memberRow.id),
    rewards: rewards.map((row) => ({
      id: row.id,
      type: row.rewardType as LoyaltyRewardType,
      label: rewardLabelForType(row.rewardType as LoyaltyRewardType),
      unlockedAt: row.unlockedAt,
      redeemedAt: row.redeemedAt ?? undefined,
    })),
    recentEvents: recentEvents.map((row) => ({
      id: row.id,
      stampsAdded: row.stampsAdded,
      isBonus: row.isBonus,
      rewardUnlocked: row.rewardUnlocked,
      reason: row.reason ?? undefined,
      createdAt: row.createdAt,
    })),
  };
}

async function grantReward(
  memberId: string,
  type: LoyaltyRewardType,
  now: string
) {
  const db = getDb();
  await db.insert(loyaltyRewards).values({
    memberId,
    rewardType: type,
    unlockedAt: now,
    redeemedAt: null,
  });
}

async function applyStampsToMember(
  member: typeof loyaltyMembers.$inferSelect,
  stampsAdded: number,
  now: string
) {
  let currentStamps = member.currentStamps + stampsAdded;
  let lifetimeStamps = member.lifetimeStamps + stampsAdded;
  let rewardUnlocked = false;
  let milestone20Granted = member.milestone20Granted;
  let milestone30Granted = member.milestone30Granted;

  while (currentStamps >= LOYALTY_STAMPS_TARGET) {
    currentStamps -= LOYALTY_STAMPS_TARGET;
    rewardUnlocked = true;
    await grantReward(member.id, "entrada", now);
  }

  for (const milestone of LOYALTY_MILESTONES) {
    if (milestone.type === "entrada") continue;
    if (
      milestone.type === "hamburguer" &&
      !milestone20Granted &&
      lifetimeStamps >= milestone.lifetimeStamps
    ) {
      milestone20Granted = true;
      rewardUnlocked = true;
      await grantReward(member.id, "hamburguer", now);
    }
    if (
      milestone.type === "cerveja_petisco" &&
      !milestone30Granted &&
      lifetimeStamps >= milestone.lifetimeStamps
    ) {
      milestone30Granted = true;
      rewardUnlocked = true;
      await grantReward(member.id, "cerveja_petisco", now);
    }
  }

  const db = getDb();
  const [updated] = await db
    .update(loyaltyMembers)
    .set({
      currentStamps,
      lifetimeStamps,
      milestone20Granted,
      milestone30Granted,
    })
    .where(eq(loyaltyMembers.id, member.id))
    .returning();

  return { updated: updated!, rewardUnlocked };
}

export async function registerLoyaltyMember(input: {
  name: string;
  phone: string;
  birthDate: string;
  pin: string;
  referredByCode?: string;
}): Promise<LoyaltyMemberProfile> {
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const birthDate = input.birthDate.trim();
  const pin = input.pin.trim();

  if (!name) throw new Error("Nome obrigatório");
  if (phone.length < 9) throw new Error("Telemóvel inválido");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error("Data de nascimento obrigatória");
  }
  if (!/^\d{4}$/.test(pin)) throw new Error("PIN de 4 dígitos obrigatório");

  const db = getDb();

  const existingPhone = await db
    .select({ id: loyaltyMembers.id })
    .from(loyaltyMembers)
    .where(eq(loyaltyMembers.phone, phone))
    .limit(1);
  if (existingPhone.length > 0) {
    throw new Error("Este telemóvel já tem cartão — inicie sessão");
  }

  let referredByMemberId: string | null = null;

  if (input.referredByCode?.trim()) {
    const [referrer] = await db
      .select({ id: loyaltyMembers.id })
      .from(loyaltyMembers)
      .where(
        eq(
          loyaltyMembers.memberCode,
          input.referredByCode.trim().toUpperCase()
        )
      )
      .limit(1);
    if (referrer) referredByMemberId = referrer.id;
  }

  const now = new Date().toISOString();
  const memberCode = await uniqueMemberCode();
  const memberId = uuidv4();
  const pinHash = await hashMemberPin(pin, memberId);

  const [member] = await db
    .insert(loyaltyMembers)
    .values({
      id: memberId,
      name,
      phone,
      birthDate,
      pinHash,
      avatarUrl: null,
      memberCode,
      currentStamps: 0,
      lifetimeStamps: 0,
      bonusClaimedMonth: null,
      referredByMemberId,
      referralBonusPaid: false,
      milestone20Granted: false,
      milestone30Granted: false,
      birthdayRewardYear: null,
      streakBonusWeek: null,
      createdAt: now,
    })
    .returning();

  return buildProfile(member!);
}

export async function loginLoyaltyMember(input: {
  phone: string;
  pin: string;
}): Promise<LoyaltyMemberProfile> {
  const phone = normalizePhone(input.phone);
  const pin = input.pin.trim();
  if (phone.length < 9) throw new Error("Telemóvel inválido");
  if (!/^\d{4}$/.test(pin)) throw new Error("PIN inválido");

  const db = getDb();
  const [member] = await db
    .select()
    .from(loyaltyMembers)
    .where(eq(loyaltyMembers.phone, phone))
    .limit(1);

  if (!member) throw new Error("Cartão não encontrado");
  if (!member.pinHash) {
    throw new Error("Conta sem PIN — contacte a caixa");
  }

  const valid = await verifyMemberPin(pin, member.id, member.pinHash);
  if (!valid) throw new Error("PIN incorreto");

  return buildProfile(member);
}

export async function updateLoyaltyMemberProfile(
  memberId: string,
  input: {
    name?: string;
    phone?: string;
    avatarUrl?: string | null;
    pin?: string;
    currentPin?: string;
  }
): Promise<LoyaltyMemberProfile> {
  const db = getDb();
  const [member] = await db
    .select()
    .from(loyaltyMembers)
    .where(eq(loyaltyMembers.id, memberId))
    .limit(1);

  if (!member) throw new Error("Membro não encontrado");

  const updates: Partial<typeof loyaltyMembers.$inferInsert> = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("Nome obrigatório");
    updates.name = name;
  }

  if (input.phone !== undefined) {
    const phone = normalizePhone(input.phone);
    if (phone.length < 9) throw new Error("Telemóvel inválido");
    const [other] = await db
      .select({ id: loyaltyMembers.id })
      .from(loyaltyMembers)
      .where(eq(loyaltyMembers.phone, phone))
      .limit(1);
    if (other && other.id !== memberId) {
      throw new Error("Este telemóvel já está registado");
    }
    updates.phone = phone;
  }

  if (input.avatarUrl !== undefined) {
    updates.avatarUrl = validateAvatarDataUrl(input.avatarUrl);
  }

  if (input.pin !== undefined) {
    const nextPin = input.pin.trim();
    if (!/^\d{4}$/.test(nextPin)) throw new Error("PIN de 4 dígitos");
    const currentPin = input.currentPin?.trim() ?? "";
    if (!member.pinHash) {
      updates.pinHash = await hashMemberPin(nextPin, memberId);
    } else {
      if (!currentPin) throw new Error("Introduza o PIN actual");
      const valid = await verifyMemberPin(currentPin, memberId, member.pinHash);
      if (!valid) throw new Error("PIN actual incorrecto");
      updates.pinHash = await hashMemberPin(nextPin, memberId);
    }
  }

  if (Object.keys(updates).length === 0) {
    return buildProfile(member);
  }

  const [updated] = await db
    .update(loyaltyMembers)
    .set(updates)
    .where(eq(loyaltyMembers.id, memberId))
    .returning();

  return buildProfile(updated!);
}

export async function getLoyaltyAdminStats(): Promise<LoyaltyAdminStats> {
  const db = getDb();
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeSince = new Date(now);
  activeSince.setDate(activeSince.getDate() - 30);

  const dayStartIso = dayStart.toISOString();
  const weekStartIso = weekStart.toISOString();
  const monthStartIso = monthStart.toISOString();
  const activeSinceIso = activeSince.toISOString();

  const [totals] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loyaltyMembers);

  const [newWeek] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loyaltyMembers)
    .where(gte(loyaltyMembers.createdAt, weekStartIso));

  const [newMonth] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loyaltyMembers)
    .where(gte(loyaltyMembers.createdAt, monthStartIso));

  const [stampsToday] = await db
    .select({ count: sql<number>`coalesce(sum(${loyaltyStampEvents.stampsAdded}), 0)::int` })
    .from(loyaltyStampEvents)
    .where(gte(loyaltyStampEvents.createdAt, dayStartIso));

  const [stampsWeek] = await db
    .select({ count: sql<number>`coalesce(sum(${loyaltyStampEvents.stampsAdded}), 0)::int` })
    .from(loyaltyStampEvents)
    .where(gte(loyaltyStampEvents.createdAt, weekStartIso));

  const [rewardsAvailable] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loyaltyRewards)
    .where(isNull(loyaltyRewards.redeemedAt));

  const [rewardsRedeemedMonth] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loyaltyRewards)
    .where(
      and(
        isNotNull(loyaltyRewards.redeemedAt),
        gte(loyaltyRewards.redeemedAt, monthStartIso)
      )
    );

  const activeRows = await db
    .selectDistinct({ memberId: loyaltyStampEvents.memberId })
    .from(loyaltyStampEvents)
    .where(gte(loyaltyStampEvents.createdAt, activeSinceIso));

  const recentRows = await db
    .select()
    .from(loyaltyMembers)
    .orderBy(desc(loyaltyMembers.createdAt))
    .limit(12);

  const recentMembers = await Promise.all(
    recentRows.map(async (row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone ?? undefined,
      memberCode: row.memberCode,
      totalVisits: await countTotalVisits(row.id),
      lifetimeStamps: row.lifetimeStamps,
      createdAt: row.createdAt,
      lastVisitAt: await getLastVisitAt(row.id),
    }))
  );

  return {
    totalMembers: totals?.count ?? 0,
    newMembersWeek: newWeek?.count ?? 0,
    newMembersMonth: newMonth?.count ?? 0,
    stampsToday: stampsToday?.count ?? 0,
    stampsWeek: stampsWeek?.count ?? 0,
    rewardsAvailable: rewardsAvailable?.count ?? 0,
    rewardsRedeemedMonth: rewardsRedeemedMonth?.count ?? 0,
    activeMembers30d: activeRows.length,
    recentMembers,
  };
}

export async function getLoyaltyMemberById(id: string) {
  const db = getDb();
  const [member] = await db
    .select()
    .from(loyaltyMembers)
    .where(eq(loyaltyMembers.id, id))
    .limit(1);
  if (!member) return null;
  return buildProfile(member);
}

export async function getLoyaltyMemberByCode(memberCode: string) {
  const db = getDb();
  const [member] = await db
    .select()
    .from(loyaltyMembers)
    .where(eq(loyaltyMembers.memberCode, memberCode.trim().toUpperCase()))
    .limit(1);
  if (!member) return null;
  return buildProfile(member);
}

export async function addLoyaltyStamp(input: {
  memberCode: string;
  addedBy?: string;
}): Promise<LoyaltyStampResult> {
  const db = getDb();
  const code = input.memberCode.trim().toUpperCase();

  const [member] = await db
    .select()
    .from(loyaltyMembers)
    .where(eq(loyaltyMembers.memberCode, code))
    .limit(1);

  if (!member) throw new Error("Cliente não encontrado");

  const now = new Date().toISOString();
  const monthKey = currentMonthKey();
  const weekKey = getIsoWeekKey();
  const mealsBefore = await countMealsThisMonth(member.id);
  const visitsBefore = await countTotalVisits(member.id);
  const visitWeeks = await getVisitWeekKeys(member.id);
  visitWeeks.push(weekKey);

  let stampsAdded = 0;
  const reasons: string[] = [];
  let isBonus = false;
  let rewardUnlocked = false;
  let bonusClaimedMonth = member.bonusClaimedMonth;
  let streakBonusWeek = member.streakBonusWeek;
  let referralBonusPaid = member.referralBonusPaid;

  stampsAdded += 1;
  reasons.push("visita");

  if (
    mealsBefore >= LOYALTY_MONTHLY_MEALS_FOR_BONUS &&
    member.bonusClaimedMonth !== monthKey
  ) {
    stampsAdded += LOYALTY_BONUS_STAMPS - 1;
    isBonus = true;
    bonusClaimedMonth = monthKey;
    reasons.push("desafio_mensal");
  }

  const streakCount = countConsecutiveWeeks(visitWeeks, weekKey);
  if (
    streakCount >= LOYALTY_STREAK_WEEKS &&
    member.streakBonusWeek !== weekKey
  ) {
    stampsAdded += 1;
    streakBonusWeek = weekKey;
    reasons.push("sequencia");
  }

  let workingMember = { ...member };

  const firstResult = await applyStampsToMember(workingMember, stampsAdded, now);
  workingMember = {
    ...firstResult.updated,
    bonusClaimedMonth,
    streakBonusWeek,
    referralBonusPaid,
  };
  rewardUnlocked = rewardUnlocked || firstResult.rewardUnlocked;

  if (
    member.referredByMemberId &&
    !member.referralBonusPaid &&
    visitsBefore === 0
  ) {
    referralBonusPaid = true;
    const [referrer] = await db
      .select()
      .from(loyaltyMembers)
      .where(eq(loyaltyMembers.id, member.referredByMemberId))
      .limit(1);

    if (referrer) {
      const refResult = await applyStampsToMember(
        referrer,
        LOYALTY_REFERRAL_STAMPS,
        now
      );
      if (refResult.rewardUnlocked) rewardUnlocked = true;

      const inviteeBonus = await applyStampsToMember(
        workingMember,
        LOYALTY_REFERRAL_STAMPS,
        now
      );
      workingMember = inviteeBonus.updated;
      if (inviteeBonus.rewardUnlocked) rewardUnlocked = true;
      stampsAdded += LOYALTY_REFERRAL_STAMPS;
      reasons.push("convite");
    }
  }

  await db.insert(loyaltyStampEvents).values({
    memberId: member.id,
    stampsAdded,
    isBonus,
    rewardUnlocked,
    reason: reasons.join(","),
    addedBy: input.addedBy?.trim() || "Caixa",
    createdAt: now,
  });

  const [updatedMember] = await db
    .update(loyaltyMembers)
    .set({
      currentStamps: workingMember.currentStamps,
      lifetimeStamps: workingMember.lifetimeStamps,
      milestone20Granted: workingMember.milestone20Granted,
      milestone30Granted: workingMember.milestone30Granted,
      bonusClaimedMonth,
      streakBonusWeek,
      referralBonusPaid,
    })
    .where(eq(loyaltyMembers.id, member.id))
    .returning();

  const profile = await buildProfile(updatedMember!);

  let message = isBonus
    ? `Bónus mensal! +${stampsAdded} selos`
    : `+${stampsAdded} selo${stampsAdded > 1 ? "s" : ""}`;

  if (reasons.includes("sequencia")) message += " · Sequências semanais!";
  if (reasons.includes("convite")) message += " · Bónus convite!";
  if (rewardUnlocked) message += " · Recompensa desbloqueada!";

  return {
    member: profile,
    stampsAdded,
    isBonus,
    rewardUnlocked,
    message,
  };
}

export async function redeemLoyaltyReward(memberId: string, rewardId: number) {
  const db = getDb();
  const now = new Date().toISOString();

  const [reward] = await db
    .select()
    .from(loyaltyRewards)
    .where(
      and(
        eq(loyaltyRewards.id, rewardId),
        eq(loyaltyRewards.memberId, memberId),
        isNull(loyaltyRewards.redeemedAt)
      )
    )
    .limit(1);

  if (!reward) throw new Error("Recompensa não encontrada");

  await db
    .update(loyaltyRewards)
    .set({ redeemedAt: now })
    .where(eq(loyaltyRewards.id, rewardId));

  const profile = await getLoyaltyMemberById(memberId);
  if (!profile) throw new Error("Membro não encontrado");
  return profile;
}

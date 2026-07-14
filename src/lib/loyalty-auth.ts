import { getAuthSecret } from "@/lib/auth";

export const LOYALTY_SESSION_COOKIE = "hamburgaria_loyalty_session";
const SESSION_VERSION = "lv1";

/** Sessão de cliente válida 90 dias — app instalável no telemóvel. */
const LOYALTY_SESSION_MS = 90 * 24 * 60 * 60 * 1000;

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isValidMemberPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return arrayBufferToBase64Url(signature);
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hashMemberPin(
  pin: string,
  memberId: string
): Promise<string> {
  return hmacSign(`loyalty-pin:${memberId}:${pin}`, getAuthSecret());
}

export async function verifyMemberPin(
  pin: string,
  memberId: string,
  pinHash: string | null | undefined
): Promise<boolean> {
  if (!pinHash || !isValidMemberPin(pin)) return false;
  const expected = await hashMemberPin(pin, memberId);
  return safeEqual(expected, pinHash);
}

export async function createLoyaltySessionToken(memberId: string): Promise<{
  token: string;
  expiresAt: number;
}> {
  const expiresAt = Date.now() + LOYALTY_SESSION_MS;
  const payload = `${SESSION_VERSION}.${memberId}.${expiresAt}`;
  const signature = await hmacSign(payload, getAuthSecret());
  return { token: `${payload}.${signature}`, expiresAt };
}

export async function verifyLoyaltySessionToken(
  token: string | undefined | null
): Promise<string | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== SESSION_VERSION) return null;

  const memberId = parts[1]!;
  const expiresAt = Number(parts[2]);
  if (!memberId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null;
  }

  const payload = `${SESSION_VERSION}.${memberId}.${expiresAt}`;
  const expected = await hmacSign(payload, getAuthSecret());
  if (!safeEqual(parts[3]!, expected)) return null;

  return memberId;
}

export function getLoyaltySessionMaxAgeSeconds(expiresAt: number): number {
  return Math.max(60, Math.floor((expiresAt - Date.now()) / 1000));
}

export const MAX_AVATAR_BYTES = 280_000;

export function validateAvatarDataUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("data:image/")) {
    throw new Error("Formato de imagem inválido");
  }
  if (value.length > MAX_AVATAR_BYTES) {
    throw new Error("Imagem demasiado grande (máx. ~200 KB)");
  }
  return value;
}

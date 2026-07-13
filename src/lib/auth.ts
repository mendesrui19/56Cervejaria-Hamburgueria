export const SESSION_COOKIE = "hamburgaria_staff_session";

const SESSION_VERSION = "v1";

export function getStaffPin(): string {
  return process.env.STAFF_PIN ?? "5656";
}

export function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    "hamburgaria-dev-secret-change-in-production"
  );
}

/** Sessão válida até às 04:00 — cobre o serviço completo incluindo noite. */
export function getSessionExpiry(): number {
  const now = new Date();
  const expiry = new Date(now);

  if (now.getHours() < 4) {
    expiry.setHours(4, 0, 0, 0);
  } else {
    expiry.setDate(expiry.getDate() + 1);
    expiry.setHours(4, 0, 0, 0);
  }

  return expiry.getTime();
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

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin) && safeEqual(pin, getStaffPin());
}

export async function createSessionToken(): Promise<{
  token: string;
  expiresAt: number;
}> {
  const expiresAt = getSessionExpiry();
  const payload = `${SESSION_VERSION}.${expiresAt}`;
  const signature = await hmacSign(payload, getAuthSecret());
  return { token: `${payload}.${signature}`, expiresAt };
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== SESSION_VERSION) return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const payload = `${SESSION_VERSION}.${expiresAt}`;
  const expected = await hmacSign(payload, getAuthSecret());
  return safeEqual(parts[2], expected);
}

export function getSessionMaxAgeSeconds(expiresAt: number): number {
  return Math.max(60, Math.floor((expiresAt - Date.now()) / 1000));
}

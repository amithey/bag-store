import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "sh_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 2;

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

export async function isAdminAuthenticated() {
  const session = await getAdminSession();
  return Boolean(session);
}

export async function getAdminSession() {
  const secret = getSessionSecret();
  if (!secret) return null;

  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!value) return null;

  const session = verifySession(value, secret);
  return session;
}

export async function setAdminSession() {
  const secret = getSessionSecret();
  if (!secret) return;

  const cookieStore = await cookies();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: randomUUID(),
  };

  cookieStore.set(ADMIN_COOKIE, signSession(payload, secret), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 0,
  });
}

export function isValidAdminPassword(password: string) {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!configuredPassword) return false;

  return safeEqual(password, configuredPassword);
}

export function getAdminSessionTtlMinutes() {
  return Math.floor(SESSION_TTL_SECONDS / 60);
}

type AdminSessionPayload = {
  iat: number;
  exp: number;
  nonce: string;
};

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim() || "";
}

function signSession(payload: AdminSessionPayload, secret: string) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifySession(value: string, secret: string): AdminSessionPayload | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;

  const expectedSignature = createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminSessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload.nonce || !Number.isFinite(payload.iat) || !Number.isFinite(payload.exp)) return null;
    if (payload.exp <= now) return null;
    if (payload.iat > now + 60) return null;

    return payload;
  } catch {
    return null;
  }
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSession,
  isValidAdminPassword,
  setAdminSession,
} from "@/lib/adminAuth";
import { checkRateLimit, clearRateLimit } from "@/lib/rateLimit";
import { assertSameOrigin, getClientIpKey } from "@/lib/requestSecurity";

export type LoginState = {
  error?: string;
};

export async function loginAdmin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  await assertSameOrigin();

  const password = String(formData.get("password") || "");
  const clientKey = await getClientIpKey("admin-login");
  const limit = checkRateLimit(clientKey, { maxAttempts: 6, windowSeconds: 15 * 60 });

  if (!limit.allowed) {
    return {
      error: `יותר מדי ניסיונות כניסה. נסו שוב בעוד ${Math.ceil(limit.retryAfterSeconds / 60)} דקות.`,
    };
  }

  if (!isValidAdminPassword(password)) {
    // Slow down brute-force attempts (defense-in-depth alongside the rate limit,
    // which is per-instance on serverless). Only penalises wrong passwords.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { error: "פרטי הכניסה לא נכונים." };
  }

  clearRateLimit(clientKey);
  await setAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await assertSameOrigin();
  await clearAdminSession();
  redirect("/admin");
}

"use server";

import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/clients";
import { assertSameOrigin } from "@/lib/requestSecurity";
import { requireAdmin } from "./guards";

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type ImageUploadTicket =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; error: string };

// Product photos are uploaded by the browser directly to Supabase Storage with
// a one-time signed URL. Sending them through a Server Action instead would hit
// the 1MB action body limit (and Vercel's 4.5MB request cap), so any real phone
// photo would fail. The server still decides the path, type and size.
export async function createProductImageUpload(
  contentType: string,
  size: number
): Promise<ImageUploadTicket> {
  await assertSameOrigin();
  await requireAdmin();

  const ext = IMAGE_EXTENSIONS[contentType];
  if (!ext) return { ok: false, error: "סוג קובץ לא נתמך. אפשר JPG, PNG, WEBP או GIF." };
  if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "התמונה גדולה מדי (עד 8MB)." };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "חסר מפתח ניהול של Supabase." };

  const path = `products/${Date.now()}-${randomUUID()}.${ext}`;
  const bucket = supabase.storage.from("product-images");
  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[admin] failed to create image upload url:", error);
    return { ok: false, error: "לא הצלחנו להכין את ההעלאה. נסי שוב." };
  }

  return {
    ok: true,
    path: data.path,
    token: data.token,
    publicUrl: bucket.getPublicUrl(data.path).data.publicUrl,
  };
}

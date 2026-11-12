"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  composeFullName,
  missingForPublish,
  parsePrice,
  rowToInput,
  type ProductInput,
  type SaveResult,
} from "@/lib/admin/product-input";
import type { ProductRow } from "@/lib/catalog/types";
import { getStoragePathFromPublicUrl, uniqueSafeImages } from "@/lib/images/references";
import { parseImageSettings, type ImageSettings } from "@/lib/images/settings";
import { getStockStatusFromState } from "@/lib/productStock";
import { assertSameOrigin } from "@/lib/requestSecurity";
import { getSupabaseAdminClient } from "@/lib/supabase/clients";
import { requireAdmin } from "./guards";

const inputSchema = z.object({
  id: z.string().max(20),
  name: z.string().max(120),
  nameEn: z.string().max(120),
  price: z.string().max(20),
  category: z.enum(["shoulder", "hand"]),
  material: z.string().max(200),
  dimensions: z.string().max(100),
  description: z.string().max(3000),
  stockState: z.enum(["ready", "made_to_order", "last", "sold_out", "custom"]),
  stockText: z.string().max(120),
  isActive: z.boolean(),
  images: z.array(z.string().max(2000)).max(12),
  imageSettings: z.record(z.string(), z.unknown()),
  displayMode: z.enum(["single", "pair"]),
  pairLayout: z.enum(["side", "stacked"]),
});

const SQL_HINT =
  "חסרות עמודות במסד הנתונים. צריך להריץ פעם אחת את הקובץ supabase/image-settings.sql ב-Supabase.";

function friendlyDatabaseError(error: { message: string }): string {
  if (/image_settings|display_mode|pair_layout/.test(error.message)) return SQL_HINT;
  return "השמירה נכשלה. נסי שוב בעוד רגע.";
}

// Saves a bag, new or existing.
//
// Never throws: a problem comes back as a message the editor can show next to
// the save button. A bag that is not complete enough to be shown is saved as a
// hidden draft and the owner is told exactly what is missing, instead of being
// silently hidden.
export async function saveProduct(rawInput: ProductInput): Promise<SaveResult> {
  await assertSameOrigin();
  await requireAdmin();

  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, message: "הפרטים שנשלחו לא תקינים. רעננו את הדף ונסו שוב." };
  const input = parsed.data as ProductInput;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, message: "חסר מפתח ניהול של Supabase." };

  const images = uniqueSafeImages(input.images);
  const imageSettings = onlyForPhotos(parseImageSettings(input.imageSettings), images);
  const displayMode = input.displayMode === "pair" && images.length >= 2 ? "pair" : "single";

  const missing = missingForPublish({ ...input, images });
  const isActive = input.isActive && missing.length === 0;
  const notice =
    input.isActive && !isActive ? `נשמר כטיוטה ולא מוצג באתר. כדי להציג חסר: ${missing.join(", ")}.` : undefined;

  const fullName = composeFullName(input) || "תיק חדש";
  const fields = {
    name: fullName,
    material: input.material.trim(),
    dimensions: input.dimensions.trim(),
    price_num: parsePrice(input.price) || 1,
    image: images[0] ?? "",
    images,
    alt: `תמונה של ${input.name.trim() || "התיק"}`,
    stock_status: getStockStatusFromState(input.stockState, input.stockText),
    description: input.description.trim(),
    category: input.category,
    is_active: isActive,
    image_settings: imageSettings,
    display_mode: displayMode,
    pair_layout: input.pairLayout,
  };

  let id = input.id.trim();

  if (id) {
    const { data: existing, error: readError } = await supabase
      .from("products")
      .select("id,image,images")
      .eq("id", id)
      .maybeSingle();
    if (readError) {
      console.error("[admin] failed to read product before save:", readError);
      return { ok: false, message: friendlyDatabaseError(readError) };
    }
    if (!existing) return { ok: false, message: "התיק לא נמצא. ייתכן שנמחק." };

    const { error } = await supabase.from("products").update(fields).eq("id", id);
    if (error) {
      console.error("[admin] failed to update product:", error);
      return { ok: false, message: friendlyDatabaseError(error) };
    }

    const before = uniqueSafeImages([existing.image, ...((existing.images as string[] | null) ?? [])]);
    await removeUnreferencedPhotos(supabase, before.filter((photo) => !images.includes(photo)), id);
  } else {
    const created = await insertWithNextId(supabase, fields);
    if (!created.ok) return created;
    id = created.id;
  }

  revalidatePath("/", "layout");
  return { ok: true, id, published: isActive, notice };
}

// Shows or hides a bag straight from the list.
export async function setProductVisibility(
  id: string,
  visible: boolean
): Promise<{ ok: true } | { ok: false; message: string }> {
  await assertSameOrigin();
  await requireAdmin();

  const supabase = getSupabaseAdminClient();
  if (!supabase || !id) return { ok: false, message: "לא ניתן לעדכן כרגע." };

  if (visible) {
    const { data: row } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (!row) return { ok: false, message: "התיק לא נמצא." };
    const missing = missingForPublish(rowToInput(row as ProductRow));
    if (missing.length) return { ok: false, message: `אי אפשר להציג באתר. חסר: ${missing.join(", ")}.` };
  }

  const { error } = await supabase.from("products").update({ is_active: visible }).eq("id", id);
  if (error) {
    console.error("[admin] failed to change visibility:", error);
    return { ok: false, message: "העדכון נכשל. נסי שוב." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Permanently deletes a bag. Its photo files are removed too, but only those no
// other bag is still using: copies of a bag share the same files, and deleting
// a copy used to erase the photos of the original.
export async function deleteProduct(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  await assertSameOrigin();
  await requireAdmin();

  const supabase = getSupabaseAdminClient();
  if (!supabase || !id) return { ok: false, message: "לא ניתן למחוק כרגע." };

  const { data: row, error: readError } = await supabase
    .from("products")
    .select("image,images")
    .eq("id", id)
    .maybeSingle();
  if (readError) {
    console.error("[admin] failed to read product before delete:", readError);
    return { ok: false, message: "המחיקה נכשלה. נסי שוב." };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("[admin] failed to delete product:", error);
    return { ok: false, message: "המחיקה נכשלה. נסי שוב." };
  }

  if (row) {
    await removeUnreferencedPhotos(supabase, uniqueSafeImages([row.image, ...((row.images as string[] | null) ?? [])]), id);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Saves a new order for the bags: the first id is shown first on the site.
export async function reorderProducts(ids: string[]): Promise<{ ok: true } | { ok: false; message: string }> {
  await assertSameOrigin();
  await requireAdmin();

  const supabase = getSupabaseAdminClient();
  const clean = z.array(z.string().min(1).max(20)).max(500).safeParse(ids);
  if (!supabase || !clean.success) return { ok: false, message: "לא ניתן לשמור את הסדר כרגע." };

  const results = await Promise.all(
    clean.data.map((id, index) => supabase.from("products").update({ sort_order: (index + 1) * 10 }).eq("id", id))
  );
  if (results.some((result) => result.error)) {
    console.error("[admin] failed to reorder products");
    return { ok: false, message: "שמירת הסדר נכשלה. נסי שוב." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// ---- helpers (not exported: a "use server" file may only export actions) ----

function onlyForPhotos(settings: ImageSettings, photos: string[]): ImageSettings {
  return Object.fromEntries(Object.entries(settings).filter(([photo]) => photos.includes(photo)));
}

// A new bag gets the next free id. If two saves race for the same id the
// database refuses the second one (the id is the primary key) and we try the
// next number, so a bag can never overwrite another.
async function insertWithNextId(
  supabase: SupabaseClient,
  fields: Record<string, unknown>
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: rows, error: readError } = await supabase.from("products").select("id,sort_order");
    if (readError) {
      console.error("[admin] failed to read products before insert:", readError);
      return { ok: false, message: "לא הצלחנו לקרוא את התיקים הקיימים. נסי שוב." };
    }

    const highestId = (rows ?? []).reduce((max, row) => {
      const value = Number(row.id);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    const highestOrder = (rows ?? []).reduce((max, row) => Math.max(max, Number(row.sort_order) || 0), 0);
    const id = String(highestId + 1).padStart(2, "0");

    const { error } = await supabase.from("products").insert({ ...fields, id, sort_order: highestOrder + 10 });
    if (!error) return { ok: true, id };
    if (error.code === "23505") continue; // id taken a moment ago: try the next one

    console.error("[admin] failed to insert product:", error);
    return { ok: false, message: friendlyDatabaseError(error) };
  }
  return { ok: false, message: "לא הצלחנו ליצור את התיק. נסי שוב." };
}

// Removes photo files from storage, except any that another bag still uses.
async function removeUnreferencedPhotos(supabase: SupabaseClient, photos: string[], exceptProductId: string) {
  const candidates = photos
    .map((photo) => ({ photo, path: getStoragePathFromPublicUrl(photo) }))
    .filter((entry): entry is { photo: string; path: string } => Boolean(entry.path));
  if (!candidates.length) return;

  const { data: others, error } = await supabase.from("products").select("image,images").neq("id", exceptProductId);
  if (error) {
    // Better to leave a file behind than to delete one that might be in use.
    console.warn("[admin] skipped photo cleanup, could not check other bags:", error.message);
    return;
  }

  const inUse = new Set((others ?? []).flatMap((row) => [row.image, ...((row.images as string[] | null) ?? [])]));
  const paths = candidates.filter((entry) => !inUse.has(entry.photo)).map((entry) => entry.path);
  if (!paths.length) return;

  const { error: removeError } = await supabase.storage.from("product-images").remove(paths);
  if (removeError) console.warn("[admin] photo cleanup failed:", removeError.message);
}

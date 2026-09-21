"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  isAdminAuthenticated,
  isValidAdminPassword,
  setAdminSession,
} from "@/lib/adminAuth";
import { getAdminProducts, getSupabaseAdminClient, type ProductRow } from "@/lib/supabaseProducts";
import {
  updateOrderRecordStatus,
  type OrderStatus,
} from "@/lib/supabaseOrders";
import { checkRateLimit, clearRateLimit } from "@/lib/rateLimit";
import { assertSameOrigin, getClientIpKey } from "@/lib/requestSecurity";
import { getStockStatusFromState, type ProductStockState } from "@/lib/productStock";
import { saveSiteContent, type SiteContent } from "@/lib/siteContent";

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

export async function saveProduct(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role key is missing.");
  }

  const existingProducts = await getAdminProducts();
  const id = String(formData.get("id") || "").trim() || getNextProductId(existingProducts);
  const isEdit = Boolean(String(formData.get("id") || "").trim());
  const existingImage = String(formData.get("existingImage") || "").trim();
  const orderedImages = parseImageList(String(formData.get("orderedImages") || ""));
  const existingImages = uniqueImages([
    ...orderedImages,
    ...parseImageList(String(formData.get("existingImages") || "")),
    existingImage,
  ]);
  const removedImages = new Set(
    formData
      .getAll("removeImages")
      .map((image) => String(image).trim())
      .filter(Boolean)
  );
  const retainedImages = existingImages.filter((image) => !removedImages.has(image));
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const imageUrls = parseImageList(String(formData.get("imageUrls") || ""));
  // Files are uploaded by the browser straight to Storage (see
  // createProductImageUpload) — only their public URLs arrive here.
  const uploadedImages = parseImageList(String(formData.get("uploadedImages") || ""));
  const images = uniqueImages([
    ...retainedImages,
    ...uploadedImages,
    ...imageUrls,
    imageUrl,
  ]);
  // price_num is an integer column; round so e.g. "149.9" doesn't fail the save.
  const priceNum = Math.round(Number(formData.get("priceNum") || 0));
  const safePriceNum = Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 1;
  const sortOrder = Number(formData.get("sortOrder") || 999);
  const wantsActive = formData.get("isActive") === "on";
  const productName = String(formData.get("name") || "").trim() || `תיק ${id}`;
  const stockState = parseStockState(String(formData.get("stockState") || "ready"));
  const stockStatus = getStockStatusFromState(
    stockState,
    String(formData.get("stockStatus") || "")
  );

  const row: ProductRow = {
    id,
    name: productName,
    material: String(formData.get("material") || "").trim(),
    dimensions: String(formData.get("dimensions") || "").trim(),
    price_num: safePriceNum,
    image: images[0] || "",
    images,
    image_fit: "cover",
    alt: createProductAlt(productName, id),
    stock_status: stockStatus,
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "shoulder") === "hand" ? "hand" : "shoulder",
    is_active: wantsActive && canPublishProduct(images[0], priceNum, formData),
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 999,
  };

  validateProduct(row, isEdit || row.is_active);

  const { error } = await supabase.from("products").upsert(row, { onConflict: "id" });
  if (error) {
    console.error("[admin] failed to save product:", error);
    throw new Error("Failed to save product.");
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveSiteContentAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();

  const content: SiteContent = {
    heroTitleLine1: String(formData.get("heroTitleLine1") || ""),
    heroTitleLine2: String(formData.get("heroTitleLine2") || ""),
    heroBody: String(formData.get("heroBody") || ""),
    collectionTitle: String(formData.get("collectionTitle") || ""),
    trustNote: String(formData.get("trustNote") || ""),
    processBody: String(formData.get("processBody") || ""),
  };

  const saved = await saveSiteContent(content);
  if (!saved) {
    throw new Error("Failed to save site content.");
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteProduct(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();

  const supabase = getSupabaseAdminClient();
  const id = String(formData.get("id") || "").trim();
  const confirmDelete = formData.get("confirmDelete") === "on";
  if (!supabase || !id || !confirmDelete) return;

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("image,images")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.error("[admin] failed to load product before delete:", fetchError);
    throw new Error("Failed to delete product.");
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("[admin] failed to delete product:", error);
    throw new Error("Failed to delete product.");
  }

  const storagePaths = uniqueStoragePaths([
    product?.image,
    ...((product?.images as string[] | null) || []),
  ]);

  if (storagePaths.length) {
    const { error: storageError } = await supabase.storage
      .from("product-images")
      .remove(storagePaths);

    if (storageError) {
      console.warn("[admin] product deleted but image cleanup failed:", storageError);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function hideProduct(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();

  const supabase = getSupabaseAdminClient();
  const id = String(formData.get("id") || "").trim();
  if (!supabase || !id) return;

  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
  if (error) {
    console.error("[admin] failed to hide product:", error);
    throw new Error("Failed to hide product.");
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateOrderStatus(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  let status = parseOrderStatus(String(formData.get("status") || "new"));
  let paymentStatus = parsePaymentStatus(String(formData.get("paymentStatus") || "pending"));
  const internalNote = formData.has("internalNote")
    ? String(formData.get("internalNote") || "")
    : undefined;

  if (!id) return;

  if (status === "paid" || status === "delivered") {
    paymentStatus = "paid";
  }

  if (status === "cancelled") {
    paymentStatus = "cancelled";
  }

  if (paymentStatus === "paid" && status !== "delivered" && status !== "cancelled") {
    status = "paid";
  }

  if (paymentStatus === "cancelled") {
    status = "cancelled";
  }

  await updateOrderRecordStatus(id, status, paymentStatus, internalNote);
  revalidatePath("/admin");
}

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

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }
}

function getNextProductId(products: ProductRow[]) {
  const max = products.reduce((current, product) => {
    const value = Number(product.id);
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, 0);

  return String(max + 1).padStart(2, "0");
}

function validateProduct(row: ProductRow, shouldBeComplete: boolean) {
  if (!row.price_num || row.price_num < 1) {
    throw new Error("Invalid product price.");
  }

  if (!shouldBeComplete) return;

  if (!row.name || !row.material || !row.dimensions || !row.image || !row.description) {
    throw new Error("Missing required product fields.");
  }
}

function createProductAlt(name: string, id: string) {
  const cleanName = name.split("|")[0]?.trim() || `תיק ${id}`;
  return `תמונה של ${cleanName}`;
}

function parseImageList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((image) => image.trim())
    .filter(isSafeImageReference)
    .filter(Boolean);
}

function uniqueImages(images: string[]) {
  return Array.from(new Set(images.filter(isSafeImageReference)));
}

function uniqueStoragePaths(images: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      images
        .map((image) => (image ? getStoragePathFromPublicUrl(image) : null))
        .filter((path): path is string => Boolean(path))
    )
  );
}

function getStoragePathFromPublicUrl(image: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const expectedHost = supabaseUrl ? new URL(supabaseUrl).hostname : "";
    const url = new URL(image);
    const marker = "/storage/v1/object/public/product-images/";

    if (!expectedHost || url.hostname !== expectedHost) return null;
    if (!url.pathname.includes(marker)) return null;

    return decodeURIComponent(url.pathname.split(marker)[1] || "");
  } catch {
    return null;
  }
}

function canPublishProduct(primaryImage: string | undefined, priceNum: number, formData: FormData) {
  return Boolean(
    primaryImage &&
      Number.isFinite(priceNum) &&
      priceNum > 0 &&
      String(formData.get("material") || "").trim() &&
      String(formData.get("dimensions") || "").trim() &&
      String(formData.get("description") || "").trim()
  );
}

function parseOrderStatus(value: string): OrderStatus {
  const allowed: OrderStatus[] = [
    "new",
    "in_progress",
    "contacted",
    "waiting_payment",
    "ready_for_delivery",
    "paid",
    "delivered",
    "cancelled",
  ];
  return allowed.includes(value as OrderStatus) ? (value as OrderStatus) : "new";
}

function parseStockState(value: string): ProductStockState {
  const allowed: ProductStockState[] = ["ready", "made_to_order", "last", "sold_out", "custom"];
  return allowed.includes(value as ProductStockState) ? (value as ProductStockState) : "ready";
}

function parsePaymentStatus(value: string): "pending" | "paid" | "cancelled" {
  return value === "paid" || value === "cancelled" ? value : "pending";
}

function isSafeImageReference(value: string) {
  if (!value) return false;
  if (value.startsWith("/images/")) return true;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "lmxrtgvfqjuxjhpejipn.supabase.co" ||
        url.hostname.endsWith(".supabase.co"))
    );
  } catch {
    return false;
  }
}

import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { products as fallbackProducts, type Product } from "./products";

export type ProductRow = {
  id: string;
  name: string;
  material: string;
  dimensions: string;
  price_num: number;
  image: string;
  images: string[] | null;
  image_fit: "cover" | "contain" | null;
  alt: string;
  stock_status: string;
  description: string;
  category: "shoulder" | "hand";
  is_active: boolean;
  sort_order: number;
};

const PRODUCT_COLUMNS =
  "id,name,material,dimensions,price_num,image,images,image_fit,alt,stock_status,description,category,is_active,sort_order";

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Storefront catalog. Deduplicated per request with cache() since the layout,
// the page and its metadata all read it. The static catalog is used only when
// Supabase isn't configured (local dev) or is unreachable — never when the
// admin simply hid every product, so hidden/deleted bags can't resurface.
export const getProducts = cache(async (): Promise<Product[]> => {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fallbackProducts;

  return (await fetchActiveProducts(supabase)) ?? fallbackProducts;
});

// Catalog used to price orders. Unlike getProducts it never falls back to the
// static list on a database error: returns null so the order is refused
// instead of being priced against stale data.
export async function getOrderableProducts(): Promise<Product[] | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fallbackProducts;

  return fetchActiveProducts(supabase);
}

async function fetchActiveProducts(supabase: SupabaseClient): Promise<Product[] | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.warn("[supabase] failed to load products:", error.message);
    return null;
  }

  return (data || []).map(rowToProduct);
}

export async function getAdminProducts(): Promise<ProductRow[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("[supabase] failed to load admin products:", error);
    return [];
  }

  return data || [];
}

export function rowToProduct(row: ProductRow): Product {
  const images = normalizeImages(row.image, row.images);

  return {
    id: row.id,
    name: row.name,
    material: row.material,
    dimensions: row.dimensions,
    price: `₪${row.price_num.toLocaleString("he-IL")}`,
    priceNum: row.price_num,
    image: images[0] || row.image,
    images,
    imageFit: row.image_fit === "contain" ? "contain" : "cover",
    alt: row.alt,
    stockStatus: row.stock_status,
    description: row.description,
    category: row.category,
  };
}

export function productToRow(product: Product, sortOrder: number): ProductRow {
  return {
    id: product.id,
    name: product.name,
    material: product.material,
    dimensions: product.dimensions,
    price_num: product.priceNum,
    image: product.image,
    images: product.images?.length ? product.images : [product.image],
    image_fit: product.imageFit || "cover",
    alt: product.alt,
    stock_status: product.stockStatus,
    description: product.description,
    category: product.category,
    is_active: true,
    sort_order: sortOrder,
  };
}

function normalizeImages(primaryImage: string, images?: string[] | null) {
  const list = [primaryImage, ...(images || [])]
    .map((image) => image?.trim())
    .filter((image): image is string => Boolean(image));

  return Array.from(new Set(list));
}

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient, getSupabaseBrowserClient } from "../supabase/clients";
import { demoProducts } from "./demo";
import { rowToProduct } from "./mappers";
import type { Catalog, Product, ProductRow } from "./types";

const PRODUCT_COLUMNS =
  "id,name,material,dimensions,price_num,image,images,image_fit,alt,stock_status,description,category,is_active,sort_order";

// Storefront catalog. Deduplicated per request with cache() since the layout,
// the page and its metadata all read it.
//
// The static demo catalog is used ONLY when Supabase isn't configured at all
// (local dev without .env). On a database error the store shows nothing
// instead: those seven demo bags are not real stock, and serving them during
// an outage silently replaced the real catalog with wrong names, wrong prices
// and bags that no longer exist — and resurrected bags the admin had hidden or
// deleted. An empty collection with a notice is honest, and it makes an outage
// obvious instead of looking like missing products.
export const getCatalog = cache(async (): Promise<Catalog> => {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { products: demoProducts, unavailable: false };

  const products = await fetchActiveProducts(supabase);
  if (!products) return { products: [], unavailable: true };

  return { products, unavailable: false };
});

export async function getProducts(): Promise<Product[]> {
  return (await getCatalog()).products;
}

// Catalog used to price orders. Unlike getProducts it never falls back to the
// static list on a database error: returns null so the order is refused
// instead of being priced against stale data.
export async function getOrderableProducts(): Promise<Product[] | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return demoProducts;

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

// Throws on a database error instead of returning an empty list. An empty list
// is indistinguishable from "no products yet", and saveProduct derives the next
// product id from it — so swallowing the error would hand a brand new bag the
// id "01" and overwrite the real product 01 on the next successful write.
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
    throw new Error(`Failed to load products from Supabase: ${error.message}`);
  }

  return data || [];
}

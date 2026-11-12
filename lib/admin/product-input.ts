import type { ImageSettings } from "../images/settings";
import { composeName, getEnglishName, getHebrewName } from "../catalog/names";
import type { ProductRow } from "../catalog/types";
import { getStockState, type ProductStockState } from "../productStock";

// Everything the editor works with, in the shape the form uses. The same type is
// what the editor sends to the server when saving.
export type ProductInput = {
  // Empty for a new bag.
  id: string;
  name: string; // Hebrew name
  nameEn: string; // optional English name
  price: string; // typed by the owner, so kept as text until saved
  category: "shoulder" | "hand";
  material: string;
  dimensions: string;
  description: string;
  stockState: ProductStockState;
  stockText: string; // only used when stockState is "custom"
  isActive: boolean;
  images: string[]; // the first one is the main photo
  imageSettings: ImageSettings;
  displayMode: "single" | "pair";
  pairLayout: "side" | "stacked";
};

export const emptyProductInput: ProductInput = {
  id: "",
  name: "",
  nameEn: "",
  price: "",
  category: "shoulder",
  material: "",
  dimensions: "",
  description: "",
  stockState: "ready",
  stockText: "",
  isActive: false,
  images: [],
  imageSettings: {},
  displayMode: "single",
  pairLayout: "side",
};

export function rowToInput(row: ProductRow): ProductInput {
  const images = Array.from(new Set([row.image, ...(row.images ?? [])].filter(Boolean)));
  return {
    id: row.id,
    name: getHebrewName(row.name),
    nameEn: getEnglishName(row.name) ?? "",
    price: row.price_num ? String(row.price_num) : "",
    category: row.category,
    material: row.material,
    dimensions: row.dimensions,
    description: row.description,
    stockState: getStockState(row.stock_status),
    stockText: row.stock_status,
    isActive: row.is_active,
    images,
    imageSettings: (row.image_settings as ImageSettings | undefined) ?? {},
    displayMode: row.display_mode === "pair" ? "pair" : "single",
    pairLayout: row.pair_layout === "stacked" ? "stacked" : "side",
  };
}

export function parsePrice(price: string): number {
  const value = Math.round(Number(price.replace(/[^0-9.]/g, "")));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function composeFullName(input: Pick<ProductInput, "name" | "nameEn">): string {
  return composeName(input.name, input.nameEn);
}

// What a bag still needs before it can be shown on the site. Written in plain
// words because the owner reads it on screen.
export function missingForPublish(
  input: Pick<ProductInput, "name" | "price" | "images" | "material" | "dimensions" | "description">
): string[] {
  const missing: string[] = [];
  if (!input.name.trim()) missing.push("שם התיק");
  if (!parsePrice(input.price)) missing.push("מחיר");
  if (!input.images.length) missing.push("לפחות תמונה אחת");
  if (!input.material.trim()) missing.push("חומר");
  if (!input.dimensions.trim()) missing.push("מידות");
  if (!input.description.trim()) missing.push("תיאור");
  return missing;
}

export type SaveResult =
  | {
      ok: true;
      id: string;
      // True if the bag is now visible on the site.
      published: boolean;
      // Set when the owner asked for it to be shown but it could not be.
      notice?: string;
    }
  | { ok: false; message: string };

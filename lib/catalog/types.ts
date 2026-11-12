import type { ImageSettings } from "../images/settings";

// The storefront shape of a bag (what the UI renders).
export type Product = {
  id: string;
  name: string;
  material: string;
  dimensions: string;
  price: string;
  priceNum: number;
  image: string;
  images: string[];
  // How each photo is framed (see lib/images/settings). A photo with no entry
  // is shown whole.
  imageSettings: ImageSettings;
  // "single": one photo on the card. "pair": the first two photos together.
  displayMode: "single" | "pair";
  // For "pair": photos side by side, or one above the other.
  pairLayout: "side" | "stacked";
  alt: string;
  stockStatus: string;
  description: string;
  category: "shoulder" | "hand";
};

// A row of the `products` table, exactly as stored in Supabase.
export type ProductRow = {
  id: string;
  name: string;
  material: string;
  dimensions: string;
  price_num: number;
  image: string;
  images: string[] | null;
  // Retired: every photo is now shown whole unless it has a crop. The column is
  // kept in the table for now, but nothing reads or writes it any more.
  image_fit?: "cover" | "contain" | null;
  // The three below exist only after supabase/image-settings.sql has been run.
  // They are optional so the site keeps working before and after that step.
  image_settings?: unknown;
  display_mode?: string | null;
  pair_layout?: string | null;
  alt: string;
  stock_status: string;
  description: string;
  category: "shoulder" | "hand";
  is_active: boolean;
  sort_order: number;
};

export type Catalog = {
  products: Product[];
  // True when Supabase is configured but could not be read, so an empty list
  // means "we can't reach the catalog right now", not "there are no bags".
  unavailable: boolean;
};

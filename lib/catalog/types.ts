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
  imageFit: "cover" | "contain";
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
  image_fit: "cover" | "contain" | null;
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

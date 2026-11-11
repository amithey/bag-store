import type { Product, ProductRow } from "./types";

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

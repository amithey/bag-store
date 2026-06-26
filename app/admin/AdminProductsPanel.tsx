"use client";

import { useMemo, useState } from "react";
import type { ProductRow } from "@/lib/supabaseProducts";
import { getStockState } from "@/lib/productStock";
import ProductForm from "./ProductForm";

type ProductFilter = "all" | "visible" | "hidden" | "ready" | "made_to_order" | "sold_out";

const filters: Array<{ value: ProductFilter; label: string }> = [
  { value: "all", label: "הכל" },
  { value: "visible", label: "מוצגים באתר" },
  { value: "hidden", label: "מוסתרים / טיוטות" },
  { value: "ready", label: "מוכן למסירה" },
  { value: "made_to_order", label: "בהזמנה אישית" },
  { value: "sold_out", label: "אזל מהמלאי" },
];

export default function AdminProductsPanel({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");

  const filteredProducts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const stockState = getStockState(product.stock_status);
      const matchesQuery =
        !cleanQuery ||
        [product.id, product.name, product.description, product.material, product.stock_status]
          .join(" ")
          .toLowerCase()
          .includes(cleanQuery);

      const matchesFilter =
        filter === "all" ||
        (filter === "visible" && product.is_active) ||
        (filter === "hidden" && !product.is_active) ||
        (filter === "ready" && (stockState === "ready" || stockState === "last")) ||
        (filter === "made_to_order" && stockState === "made_to_order") ||
        (filter === "sold_out" && stockState === "sold_out");

      return matchesQuery && matchesFilter;
    });
  }, [filter, products, query]);

  if (!products.length) {
    return (
      <p className="rounded-3xl border border-line bg-white/75 p-6 text-muted">
        עדיין אין מוצרים שמורים ב-Supabase. אם זה המסך הראשון, צריך להריץ את קובץ
        schema.sql ב-SQL Editor ואז המוצרים יופיעו כאן.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl border border-line bg-white/70 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <label>
            <span className="eyebrow mb-2 block">חיפוש תיק</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="שם, מספר דגם, חומר או תיאור..."
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
          <label>
            <span className="eyebrow mb-2 block">סינון</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as ProductFilter)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
            >
              {filters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-sm text-muted">
          מוצגים {filteredProducts.length} מתוך {products.length} תיקים.
        </p>
      </div>

      {filteredProducts.length ? (
        filteredProducts.map((product) => <ProductForm key={product.id} product={product} />)
      ) : (
        <p className="rounded-3xl border border-line bg-white/75 p-6 text-muted">
          לא נמצאו תיקים שמתאימים לחיפוש הזה.
        </p>
      )}
    </div>
  );
}

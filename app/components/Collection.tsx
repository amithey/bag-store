"use client";

import { useState } from "react";
import { type Product } from "@/lib/catalog/types";
import type { SiteContent } from "@/lib/site-content";
import { isReadyStock } from "@/lib/productStock";
import FadeIn from "./FadeIn";
import ProductCard from "./product/ProductCard";

type Filter = "all" | "shoulder" | "hand" | "ready";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "הכל" },
  { id: "shoulder", label: "תיקי כתף" },
  { id: "hand", label: "תיקי יד" },
  { id: "ready", label: "מוכן למסירה" },
];

export default function Collection({
  products,
  content,
}: {
  products: Product[];
  content: SiteContent;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filteredProducts = products.filter((p) => {
    if (filter === "all") return true;
    if (filter === "ready") return isReadyStock(p.stockStatus);
    if (filter === "shoulder") return p.category === "shoulder";
    if (filter === "hand") return p.category === "hand";
    return true;
  });

  return (
    <section id="collection" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-editorial px-5 md:px-10">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="eyebrow">הקולקציה</p>
            <h2 className="mt-4 max-w-3xl text-[38px] font-semibold leading-tight md:text-[58px]">
              {content.collectionTitle}
            </h2>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-5 py-3 text-[12px] font-bold tracking-[0.14em] transition ${
                filter === item.id
                  ? "bg-ink text-cream"
                  : "border border-line bg-white/55 text-ink hover:border-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p, i) => (
            <FadeIn key={p.id} delay={(i % 3) * 0.05}>
              <ProductCard product={p} eager={i < 3} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

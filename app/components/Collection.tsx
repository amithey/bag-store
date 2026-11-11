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
  unavailable = false,
}: {
  products: Product[];
  content: SiteContent;
  // The catalog could not be read from the database. Say so, instead of
  // leaving a silently empty grid that reads as "the store has no bags".
  unavailable?: boolean;
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

        {unavailable && (
          <div className="mt-10 rounded-[26px] border border-gold/40 bg-white/80 p-6">
            <p className="text-[15px] font-bold">הקטלוג לא נטען כרגע</p>
            <p className="mt-2 text-[14px] leading-7 text-muted">
              יש תקלה זמנית בטעינת התיקים. אפשר לרענן את הדף בעוד כמה רגעים, או ליצור קשר ישירות
              ונשמח לעזור בבחירה.
            </p>
            <a href="#contact" className="button-dark mt-4 inline-block rounded-full px-5 py-3 text-[11px]">
              יצירת קשר
            </a>
          </div>
        )}

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
              <ProductCard product={p} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

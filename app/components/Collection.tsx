"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type Product } from "@/lib/products";
import type { SiteContent } from "@/lib/siteContent";
import { isReadyStock, isSoldOut } from "@/lib/productStock";
import { useCart } from "../context/CartContext";
import FadeIn from "./FadeIn";

type Filter = "all" | "shoulder" | "hand" | "ready";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "הכל" },
  { id: "shoulder", label: "תיקי כתף" },
  { id: "hand", label: "תיקי יד" },
  { id: "ready", label: "מוכן למסירה" },
];

export default function Collection({ products, content }: { products: Product[]; content: SiteContent }) {
  const { setActiveProduct, addToCart } = useCart();
  const [filter, setFilter] = useState<Filter>("all");

  const filteredProducts = products.filter((p) => {
    if (filter === "all") return true;
    if (filter === "ready") return isReadyStock(p.stockStatus);
    if (filter === "shoulder") return p.category === "shoulder";
    if (filter === "hand") return p.category === "hand";
    return true;
  });

  const buyNow = (product: Product) => {
    if (isSoldOut(product.stockStatus)) return;
    addToCart(product);
    window.setTimeout(() => {
      window.dispatchEvent(new Event("smadar:checkout"));
    }, 0);
  };

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
              <article className="group panel overflow-hidden rounded-[26px] bg-white/72 transition duration-500 hover:-translate-y-1 hover:bg-white">
                <Link
                  href={`/product/${p.id}`}
                  onClick={(e) => {
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    setActiveProduct(p);
                  }}
                  className="block w-full text-right"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-bone">
                    <Image
                      src={p.image}
                      alt={p.alt}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 31vw, (min-width: 768px) 46vw, 100vw"
                      className={`transition duration-[900ms] ease-editorial group-hover:scale-[1.055] ${
                        p.imageFit === "contain" ? "object-contain p-4" : "object-cover"
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-80" />
                    <div className="absolute right-4 top-4 rounded-full bg-white/88 px-4 py-2 text-[11px] font-bold text-ink backdrop-blur-md">
                      {p.price}
                    </div>
                    <div className="absolute bottom-4 right-4 left-4 text-cream">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cream/72">
                        דגם {p.id}
                      </p>
                      <h3 className="mt-1 text-[24px] font-semibold leading-tight">
                        {p.name.split(" | ")[0]}
                      </h3>
                    </div>
                  </div>
                </Link>

                <div className="p-5">
                  <p className="text-[14px] leading-7 text-muted">{p.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-line/70 pt-4">
                    <span className="text-[12px] font-bold text-taupe">{p.stockStatus}</span>
                    <span className="text-[12px] font-bold text-ink">{p.dimensions}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => buyNow(p)}
                      disabled={isSoldOut(p.stockStatus)}
                      className="button-dark rounded-full px-4 py-3 text-[11px] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isSoldOut(p.stockStatus) ? "אזל מהמלאי" : "הזמנה לתיאום"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveProduct(p)}
                      className="button-light rounded-full px-4 py-3 text-[11px]"
                    >
                      פרטים
                    </button>
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

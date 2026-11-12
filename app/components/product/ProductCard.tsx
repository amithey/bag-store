"use client";

import Link from "next/link";
import { getHebrewName } from "@/lib/catalog/names";
import type { Product } from "@/lib/catalog/types";
import { isSoldOut } from "@/lib/productStock";
import { useCart } from "../../context/CartContext";
import { GRID_CARD_SIZES } from "@/lib/images/sizes";
import ProductCover from "./ProductCover";

// A bag in the collection grid. The same component is meant to be reused by
// the admin preview, so everything it needs comes from `product` and the cart
// context — no layout assumptions about where it is placed.
export default function ProductCard({
  product: p,
  eager = false,
}: {
  product: Product;
  // Cards likely to be on screen straight away load their photo immediately.
  eager?: boolean;
}) {
  const { setActiveProduct, addToCart } = useCart();
  const soldOut = isSoldOut(p.stockStatus);

  const buyNow = () => {
    if (soldOut) return;
    addToCart(p);
    window.setTimeout(() => {
      window.dispatchEvent(new Event("smadar:checkout"));
    }, 0);
  };

  return (
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
        <div className="shimmer relative aspect-[4/5] overflow-hidden bg-bone">
          <ProductCover product={p} sizes={GRID_CARD_SIZES} eager={eager} className="transition duration-[900ms] ease-editorial group-hover:scale-[1.055]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-80" />
          <div className="absolute right-4 top-4 rounded-full bg-white/88 px-4 py-2 text-[11px] font-bold text-ink backdrop-blur-md">
            {p.price}
          </div>
          <div className="absolute bottom-4 right-4 left-4 text-cream">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cream/72">
              דגם {p.id}
            </p>
            <h3 className="mt-1 text-[24px] font-semibold leading-tight">
              {getHebrewName(p.name)}
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
            onClick={buyNow}
            disabled={soldOut}
            className="button-dark rounded-full px-4 py-3 text-[11px] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {soldOut ? "אזל מהמלאי" : "הזמנה לתיאום"}
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
  );
}

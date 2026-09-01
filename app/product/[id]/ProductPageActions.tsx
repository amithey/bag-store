"use client";

import { type Product } from "@/lib/products";
import { isSoldOut } from "@/lib/productStock";
import { SMADAR_WHATSAPP } from "@/lib/orderConstants";
import { useCart } from "../../context/CartContext";

// Mirrors the add/buy logic used in Collection.tsx and ProductModal.tsx exactly,
// so a product's dedicated page behaves identically to opening it from the grid.
export default function ProductPageActions({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const soldOut = isSoldOut(product.stockStatus);
  const productName = product.name.split(" | ")[0];
  const whatsappText = `היי, רציתי לשאול לגבי הדגם ${productName} (${product.id}).`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${SMADAR_WHATSAPP}&text=${encodeURIComponent(whatsappText)}`;

  const buyNow = () => {
    if (soldOut) return;
    addToCart(product);
    window.setTimeout(() => {
      window.dispatchEvent(new Event("smadar:checkout"));
    }, 0);
  };

  const add = () => {
    if (soldOut) return;
    addToCart(product);
  };

  return (
    <div className="sticky bottom-0 mt-auto border-t border-line bg-cream/95 p-6 pt-5 backdrop-blur md:static md:rounded-2xl md:border md:p-8">
      <div className="mb-5 flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow">מחיר</p>
          <p className="mt-1 text-[34px] font-bold">{product.price}</p>
        </div>
        <p className="max-w-xs text-[13px] leading-6 text-muted">
          לא משלמים באתר כרגע. אנחנו נחזור אליכם לאישור ותיאום לפני תשלום.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={buyNow}
          disabled={soldOut}
          className="button-dark w-full rounded-full disabled:cursor-not-allowed disabled:opacity-45"
        >
          {soldOut ? "אזל מהמלאי" : "הזמנה לתיאום"}
        </button>
        <button
          onClick={add}
          disabled={soldOut}
          className="button-light w-full rounded-full disabled:cursor-not-allowed disabled:opacity-45"
        >
          שמירת תיק להזמנה
        </button>
      </div>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 block w-full rounded-full border border-line bg-white px-6 py-4 text-center text-[12px] font-bold uppercase tracking-[0.2em] text-ink transition hover:border-ink"
      >
        שאלה על הדגם בוואטסאפ
      </a>
    </div>
  );
}

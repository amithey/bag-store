"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SMADAR_WHATSAPP } from "@/lib/orderConstants";
import { isSoldOut } from "@/lib/productStock";
import { useCart } from "../context/CartContext";

export default function ProductModal() {
  const { activeProduct, setActiveProduct, addToCart } = useCart();
  const [activeImage, setActiveImage] = useState("");

  useEffect(() => {
    setActiveImage(activeProduct?.image || "");
  }, [activeProduct]);

  if (!activeProduct) return null;

  const close = () => setActiveProduct(null);
  const images = activeProduct.images?.length ? activeProduct.images : [activeProduct.image];
  const selectedImage = activeImage || images[0];
  const activeIndex = Math.max(0, images.indexOf(selectedImage));
  const imageClass = activeProduct.imageFit === "contain" ? "object-contain p-4" : "object-cover";
  const soldOut = isSoldOut(activeProduct.stockStatus);
  const productName = activeProduct.name.split(" | ")[0];
  const whatsappText = `היי, רציתי לשאול לגבי הדגם ${productName} (${activeProduct.id}).`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${SMADAR_WHATSAPP}&text=${encodeURIComponent(whatsappText)}`;

  const add = () => {
    if (soldOut) return;
    addToCart(activeProduct);
    close();
  };

  const buyNow = () => {
    if (soldOut) return;
    addToCart(activeProduct);
    close();
    window.setTimeout(() => {
      window.dispatchEvent(new Event("smadar:checkout"));
    }, 0);
  };

  const showImage = (direction: -1 | 1) => {
    const nextIndex = (activeIndex + direction + images.length) % images.length;
    setActiveImage(images[nextIndex]);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] grid place-items-center p-3 md:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 bg-ink/62 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.97 }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          className="relative z-10 grid max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-[28px] bg-cream text-ink shadow-2xl md:grid-cols-12"
        >
          <button
            onClick={close}
            className="absolute left-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[18px] font-bold text-ink backdrop-blur transition hover:bg-ink hover:text-cream"
            aria-label="סגירת חלון מוצר"
          >
            x
          </button>

          <div className="relative hidden bg-bone md:col-span-6 md:block md:h-[88vh] md:max-h-[760px]">
            <Image
              src={selectedImage}
              alt={activeProduct.alt}
              fill
              unoptimized
              priority
              sizes="50vw"
              className={imageClass}
            />
            {images.length > 1 && (
              <div className="absolute inset-x-5 bottom-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => showImage(-1)}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/86 text-xl font-bold text-ink backdrop-blur"
                  aria-label="תמונה קודמת"
                >
                  ‹
                </button>
                <span className="rounded-full bg-white/86 px-4 py-2 text-[12px] font-bold text-ink backdrop-blur">
                  {activeIndex + 1} / {images.length}
                </span>
                <button
                  type="button"
                  onClick={() => showImage(1)}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/86 text-xl font-bold text-ink backdrop-blur"
                  aria-label="תמונה הבאה"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          <div className="flex max-h-[94vh] flex-col overflow-y-auto md:col-span-6">
            <div className="relative aspect-[16/10] bg-bone md:hidden">
              <Image
                src={selectedImage}
                alt={activeProduct.alt}
                fill
                unoptimized
                priority
                sizes="100vw"
                className={imageClass}
              />
            </div>

            <div className="p-6 pb-4 md:p-10 md:pb-5">
              {images.length > 1 && (
                <div className="mb-6 rounded-2xl border border-line bg-white/55 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="eyebrow">תמונות נוספות</p>
                    <span className="text-[12px] font-bold text-muted">
                      {activeIndex + 1} מתוך {images.length}
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(image)}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-bone ${
                          image === selectedImage ? "border-ink ring-2 ring-ink/10" : "border-line"
                        }`}
                        aria-label={`תמונה ${index + 1} של ${activeProduct.name}`}
                      >
                        <Image
                          src={image}
                          alt=""
                          fill
                          unoptimized
                          sizes="64px"
                          className={activeProduct.imageFit === "contain" ? "object-contain p-1" : "object-cover"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="eyebrow">דגם {activeProduct.id}</p>
              <h2 className="mt-4 text-[34px] font-semibold leading-tight md:text-[48px]">
                {productName}
              </h2>
              <p className="mt-2 text-[13px] font-bold uppercase tracking-[0.18em] text-taupe">
                {activeProduct.name.split(" | ")[1]}
              </p>

              <div className="mt-7 grid gap-3 text-[14px] md:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white/60 p-4">
                  <span className="eyebrow block">חומר</span>
                  <span className="mt-2 block leading-7 text-muted">{activeProduct.material}</span>
                </div>
                <div className="rounded-2xl border border-line bg-white/60 p-4">
                  <span className="eyebrow block">מידות</span>
                  <span className="mt-2 block leading-7 text-muted">{activeProduct.dimensions}</span>
                </div>
              </div>

              <p className="mt-7 text-[16px] leading-8 text-muted">{activeProduct.description}</p>
              <p className="mt-5 inline-flex rounded-full bg-white px-4 py-3 text-[12px] font-bold text-taupe">
                {activeProduct.stockStatus}
              </p>
            </div>

            <div className="sticky bottom-0 mt-auto border-t border-line bg-cream/95 p-6 pt-5 backdrop-blur md:p-10 md:pt-6">
              <div className="mb-5 flex items-end justify-between gap-5">
                <div>
                  <p className="eyebrow">מחיר</p>
                  <p className="mt-1 text-[34px] font-bold">{activeProduct.price}</p>
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
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

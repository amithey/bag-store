"use client";

import Image from "next/image";
import { useState } from "react";
import { type Product } from "@/lib/products";

export default function ProductGallery({ product }: { product: Product }) {
  const images = product.images?.length ? product.images : [product.image];
  const [active, setActive] = useState(images[0]);
  const activeIndex = Math.max(0, images.indexOf(active));
  const imageClass = product.imageFit === "contain" ? "object-contain p-4" : "object-cover";

  const show = (direction: -1 | 1) => {
    const next = (activeIndex + direction + images.length) % images.length;
    setActive(images[next]);
  };

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-bone md:aspect-[3/4]">
        <Image
          src={active}
          alt={product.alt}
          fill
          unoptimized
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className={imageClass}
        />
        {images.length > 1 && (
          <div className="absolute inset-x-5 bottom-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => show(-1)}
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
              onClick={() => show(1)}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/86 text-xl font-bold text-ink backdrop-blur"
              aria-label="תמונה הבאה"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(image)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-bone ${
                image === active ? "border-ink ring-2 ring-ink/10" : "border-line"
              }`}
              aria-label={`תמונה ${index + 1} של ${product.name}`}
            >
              <Image src={image} alt="" fill unoptimized sizes="64px" className={imageClass} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

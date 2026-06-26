"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { type Product } from "@/lib/products";
import { useCart } from "../context/CartContext";
import { serifDisplay } from "../fonts";

export default function ProductCarousel({ products }: { products: Product[] }) {
  const { setActiveProduct } = useCart();
  const trackRef = useRef<HTMLDivElement>(null);
  const ctrl = useRef({
    paused: false,
    down: false,
    startX: 0,
    startScroll: 0,
    moved: 0,
  });

  // Duplicate the list so the strip can loop seamlessly.
  const loop = products.length ? [...products, ...products] : [];

  // Continuous auto-scroll (pauses on hover / while dragging).
  useEffect(() => {
    const el = trackRef.current;
    if (!el || products.length === 0) return;

    let raf = 0;
    const speed = 0.45; // px per frame
    const step = () => {
      const c = ctrl.current;
      if (!c.paused && !c.down) {
        el.scrollLeft += speed;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [products.length]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    ctrl.current.down = true;
    ctrl.current.moved = 0;
    ctrl.current.startX = e.clientX;
    ctrl.current.startScroll = el.scrollLeft;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || !ctrl.current.down) return;
    const dx = e.clientX - ctrl.current.startX;
    ctrl.current.moved = Math.max(ctrl.current.moved, Math.abs(dx));
    el.scrollLeft = ctrl.current.startScroll - dx;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    ctrl.current.down = false;
    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {}
  };

  if (products.length === 0) return null;

  return (
    <section aria-label="גלריית התיקים" className="relative overflow-hidden py-14 md:py-20">
      <div className="mx-auto mb-8 max-w-editorial px-5 md:mb-10 md:px-10">
        <h2 className={`${serifDisplay.className} mt-3 text-[30px] font-light leading-tight md:text-[44px]`}>
          הגלרייה
        </h2>
      </div>

      {/* Edge fades for a refined, framed look */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-cream to-transparent md:w-28" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-cream to-transparent md:w-28" />

      <div
        ref={trackRef}
        dir="ltr"
        data-lenis-prevent
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onMouseEnter={() => (ctrl.current.paused = true)}
        onMouseLeave={() => (ctrl.current.paused = false)}
        className="flex cursor-grab gap-5 overflow-x-hidden px-5 active:cursor-grabbing md:gap-7 md:px-10"
        style={{ touchAction: "pan-y" }}
      >
        {loop.map((p, i) => (
          <article
            key={`${p.id}-${i}`}
            className="group relative w-[230px] shrink-0 select-none md:w-[280px]"
          >
            <button
              type="button"
              onClick={() => {
                if (ctrl.current.moved > 6) return; // it was a drag, not a click
                setActiveProduct(p);
              }}
              className="block w-full text-right"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-bone shadow-[0_24px_60px_-40px_rgba(17,17,17,0.55)] ring-1 ring-line/50">
                <Image
                  src={p.image}
                  alt={p.alt}
                  fill
                  unoptimized
                  draggable={false}
                  sizes="280px"
                  className={`transition duration-700 ease-editorial group-hover:scale-[1.05] ${
                    p.imageFit === "contain" ? "object-contain p-4" : "object-cover"
                  }`}
                />
                {/* Gallery feel: name fades in softly on hover only — no price, no shop chrome */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/45 to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100" dir="rtl">
                  <h3 className={`${serifDisplay.className} text-[18px] font-medium leading-tight text-cream`}>
                    {p.name.split(" | ")[0]}
                  </h3>
                </div>
              </div>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

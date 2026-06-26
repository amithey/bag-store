"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { anatomyImage, anatomyParts } from "@/lib/products";
import FadeIn from "./FadeIn";

export default function Anatomy() {
  const [active, setActive] = useState(anatomyParts[0].number);
  const activePart = anatomyParts.find((part) => part.number === active) ?? anatomyParts[0];

  return (
    <section id="anatomy" className="relative overflow-hidden bg-ink py-24 text-cream md:py-32">
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="relative mx-auto max-w-editorial px-5 md:px-10">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="eyebrow text-gold">אנטומיה של תיק</p>
            <h2 className="mt-4 text-[38px] font-semibold leading-tight md:text-[58px]">
              הדברים הקטנים שבודקים לפני שהתיק יוצא מהסטודיו.
            </h2>
          </div>
          <p className="text-[16px] leading-8 text-cream/68 md:col-span-4 md:col-start-9">
            לחצו על המספרים כדי לראות מה נבדק בתפירה, בסגירה, ברצועה ובשימוש היומיומי.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-12 md:gap-12">
          <FadeIn className="md:col-span-7">
            <div className="relative overflow-hidden rounded-[30px] bg-[#ede4d7] p-3 soft-ring">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[22px]">
                <Image
                  src={anatomyImage.src}
                  alt={anatomyImage.alt}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
                {anatomyParts.map((part) => {
                  const isActive = part.number === active;
                  return (
                    <button
                      key={part.number}
                      type="button"
                      onMouseEnter={() => setActive(part.number)}
                      onFocus={() => setActive(part.number)}
                      onClick={() => setActive(part.number)}
                      className={`absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[11px] font-bold transition duration-300 ${
                        isActive
                          ? "scale-110 border-ink bg-ink text-cream shadow-xl"
                          : "border-white/70 bg-white/82 text-ink backdrop-blur hover:bg-white"
                      }`}
                      style={{ left: `${part.x}%`, top: `${part.y}%` }}
                      aria-label={`${part.number} ${part.title}`}
                    >
                      {part.number}
                    </button>
                  );
                })}
              </div>
            </div>
          </FadeIn>

          <div className="md:col-span-5">
            <div className="rounded-[28px] border border-cream/14 bg-white/[0.06] p-6 backdrop-blur md:p-8">
              <motion.div
                key={activePart.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-gold">
                  נקודה {activePart.number}
                </p>
                <h3 className="mt-4 text-[34px] font-semibold leading-tight">
                  {activePart.title}
                </h3>
                <p className="mt-5 text-[16px] leading-8 text-cream/72">
                  {activePart.body}
                </p>
              </motion.div>

              <div className="mt-8 space-y-2">
                {anatomyParts.map((part) => (
                  <button
                    key={part.number}
                    type="button"
                    onMouseEnter={() => setActive(part.number)}
                    onClick={() => setActive(part.number)}
                    className={`flex w-full items-center justify-between rounded-full px-4 py-3 text-right transition ${
                      active === part.number
                        ? "bg-cream text-ink"
                        : "bg-white/[0.04] text-cream/68 hover:bg-white/[0.1]"
                    }`}
                  >
                    <span className="font-bold">{part.title}</span>
                    <span className="text-[11px] font-bold tracking-[0.2em]">{part.number}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

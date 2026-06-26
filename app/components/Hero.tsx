"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { type Product } from "@/lib/products";
import type { SiteContent } from "@/lib/siteContent";
import { serifDisplay } from "../fonts";

export default function Hero({
  productCount,
  featured,
  content,
}: {
  productCount: number;
  featured?: Product;
  content: SiteContent;
}) {
  const heroImage = featured?.image || "/images/full/bag_pattern.jpg";
  const heroEnglish = featured?.name?.split(" | ")[1];
  const heroBadge = featured
    ? `דגם ${featured.id}${heroEnglish ? ` / ${heroEnglish}` : ""}`
    : "דגם 02 / Stripes Flap";
  return (
    <section id="top" className="relative overflow-hidden pt-28 md:pt-32">
      <div className="absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_12%_18%,rgba(184,138,69,0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.86),rgba(236,227,214,0.64))]" />

      <div className="relative z-10 mx-auto grid max-w-editorial items-center gap-10 px-5 pb-20 md:grid-cols-12 md:px-10 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-5"
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gold" />
            <p className="eyebrow">סטודיו בוטיק לתיקי סריגה</p>
          </div>
          <h1
            className={`${serifDisplay.className} mt-6 text-[46px] font-light leading-[1.05] tracking-[-0.005em] text-ink sm:text-[60px] lg:text-[78px]`}
          >
            {content.heroTitleLine1}
            <br />
            <span className="text-taupe">{content.heroTitleLine2}</span>
          </h1>
          <p className="mt-7 max-w-md text-[17px] leading-8 text-muted">
            {content.heroBody}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#collection" className="button-dark rounded-full">
              לצפייה בקולקציה
            </a>
            <a href="#contact" className="button-light rounded-full">
              הזמנה אישית
            </a>
          </div>

          <div className="mt-10 grid max-w-md grid-cols-3 border-y border-line/80 py-5 text-center">
            {[
              [String(productCount), "דגמים"],
              ["100%", "עבודת יד"],
              ["אשדוד", "מסירה אישית"],
            ].map(([value, label]) => (
              <div key={label} className="border-s border-line/70 first:border-s-0">
                <p className="text-[20px] font-bold text-ink">{value}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-7"
        >
          <div className="relative">
            <div className="soft-ring relative aspect-[4/5] overflow-hidden rounded-[28px] bg-white md:aspect-[5/4]">
              <Image
                src={heroImage}
                alt={featured?.alt || "תיק סרוג בדוגמת פסים"}
                fill
                priority
                unoptimized
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/28 via-transparent to-white/10" />
              <div className="absolute bottom-5 right-5 rounded-full bg-white/86 px-5 py-3 text-[12px] font-bold tracking-[0.14em] text-ink backdrop-blur-md">
                {heroBadge}
              </div>
            </div>

            <div className="panel absolute -bottom-8 left-6 hidden max-w-xs rounded-[22px] p-5 md:block">
              <p className="eyebrow">מה הופך אותו למיוחד?</p>
              <p className="mt-3 text-[14px] leading-7 text-muted">
                סריגה צפופה, בטנה מסודרת ופרזול שנבחרים לפי הדגם, כדי שהתיק יהיה יפה ונוח גם בשימוש אמיתי.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

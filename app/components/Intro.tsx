"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Intro() {
  return (
    <section className="relative hidden min-h-[70vh] overflow-hidden bg-ink text-cream md:block">
      <Image
        src="/images/full/bag_pattern.jpg"
        alt="תיק סרוג בעבודת יד"
        fill
        priority
        unoptimized
        sizes="100vw"
        className="object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.14),rgba(17,17,17,0.72)_52%,rgba(17,17,17,0.94))]" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex min-h-[70vh] max-w-editorial flex-col items-center justify-center px-10 text-center"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-cream/70">
          smadar heymans
        </p>
        <h2 className="mt-5 max-w-3xl text-[64px] font-semibold leading-[0.95] tracking-[-0.01em]">
          תיקי סריגה עם אופי.
        </h2>
        <p className="mt-7 max-w-xl text-[18px] leading-8 text-cream/78">
          סטודיו קטן באשדוד. כל תיק נסרג בנפרד, בכמויות קטנות ובתיאום אישי.
        </p>
      </motion.div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";

type Props = {
  text: string;
  duration?: number;
};

export default function Marquee({ text, duration = 60 }: Props) {
  const item = (
    <span className="mx-12 inline-flex items-center gap-12">
      <span>{text}</span>
      <span className="inline-block w-2 h-2 rounded-full bg-gold/60" />
    </span>
  );

  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden py-10 select-none"
    >
      <motion.div
        className="flex whitespace-nowrap font-serif italic font-light text-[56px] md:text-[84px] text-ink/[0.08] tracking-[-0.02em] leading-none"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        <span className="flex shrink-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={`a-${i}`}>{item}</span>
          ))}
        </span>
        <span className="flex shrink-0" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={`b-${i}`}>{item}</span>
          ))}
        </span>
      </motion.div>
    </div>
  );
}

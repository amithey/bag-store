"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type Props = {
  index: string;
  total: string;
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "split";
  rightSlot?: ReactNode;
};

export default function SectionHeader({
  index,
  total,
  label,
  title,
  intro,
  align = "left",
  rightSlot,
}: Props) {
  const reveal = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  } as const;

  const Header = (
    <div>
      <motion.div
        {...reveal}
        className="flex items-baseline gap-4 mb-6"
      >
        <span className="index-serif text-[18px] text-ink font-bold leading-none">
          {index}
        </span>
        <span className="w-16 h-px bg-ink/20" />
        <span className="font-sans text-[10px] uppercase tracking-[0.42em] text-ink/80 font-medium">
          {label}
        </span>
        <span className="index-serif text-[13px] text-ink/70 ms-auto md:ms-2 leading-none font-medium">
          / {total}
        </span>
      </motion.div>
      <motion.h2
        {...reveal}
        transition={{ ...reveal.transition, delay: 0.08 }}
        className="font-serif font-light text-[28px] sm:text-[38px] lg:text-[48px] leading-[1.08] text-ink tracking-[-0.02em] max-w-2xl"
      >
        {title}
      </motion.h2>
      {intro && (
        <motion.p
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.16 }}
          className="font-sans text-[15px] text-muted mt-7 leading-[1.85] max-w-md"
        >
          {intro}
        </motion.p>
      )}
    </div>
  );

  if (align === "split") {
    return (
      <div className="mb-20 md:mb-24 grid md:grid-cols-12 gap-10 md:gap-16 items-end">
        <div className="md:col-span-7">{Header}</div>
        {rightSlot && (
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.2 }}
            className="md:col-span-5 md:text-left"
          >
            {rightSlot}
          </motion.div>
        )}
      </div>
    );
  }

  return <div className="mb-20 md:mb-24 max-w-2xl">{Header}</div>;
}

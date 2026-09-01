"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useCart } from "../context/CartContext";

const nav = [
  { href: "/#collection", label: "קולקציה" },
  { href: "/#anatomy", label: "פרטים" },
  { href: "/#process", label: "תהליך" },
  { href: "/#contact", label: "הזמנה" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { setIsOpen, itemCount } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-5"}`}>
      <div className="mx-auto flex max-w-editorial items-center justify-between px-4 md:px-10">
        <div className="panel flex h-14 w-full items-center justify-between rounded-full px-4 md:h-16 md:px-6">
          <a href="/#top" aria-label="smadar heymans - דף הבית" className="flex items-center gap-3">
            <Logo size="md" />
            <span className="hidden text-[11px] font-bold uppercase tracking-[0.24em] text-muted md:block">
              Handmade Bags
            </span>
          </a>

          <nav className="hidden items-center gap-9 text-[12px] font-bold tracking-[0.16em] text-ink md:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="link-underline">
                {item.label}
              </a>
            ))}
          </nav>

          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 rounded-full bg-ink px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-cream transition hover:bg-[#33281f]"
          >
            <span>סל</span>
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cream px-1 text-[10px] text-ink">
              {itemCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

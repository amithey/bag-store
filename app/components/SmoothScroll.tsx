"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Buttery smooth scrolling via Lenis. Drives native scroll, so framer-motion's
 * useScroll (used in Hero/Intro) keeps working. Disabled for users who prefer
 * reduced motion.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis: Lenis | null = null;
    let raf = 0;

    // Lenis snapshots the current native scroll position the moment it's
    // constructed and treats it as truth from then on. If we create it right
    // away, that snapshot can be taken before the browser has finished its
    // own "jump to #hash on load" (e.g. a link straight to /#contact), or
    // before below-the-fold images/fonts have settled the page's real
    // height — the page then gets stuck wherever Lenis happened to sample
    // it, anywhere from the top to near the very bottom, instead of the
    // intended section. Waiting for the window "load" event lets that settle
    // first, and re-sending Lenis to the hash target once more afterwards
    // corrects it either way, whether or not the browser's own jump landed.
    const start = () => {
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      });

      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const hash = window.location.hash;
      if (hash) {
        const target = document.querySelector(hash);
        if (target instanceof HTMLElement) lenis.scrollTo(target, { immediate: true });
      }
    };

    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
    }

    return () => {
      window.removeEventListener("load", start);
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}

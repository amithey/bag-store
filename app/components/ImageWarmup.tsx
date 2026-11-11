"use client";

import { useEffect } from "react";
import { getImageProps } from "next/image";
import { GRID_CARD_SIZES, STRIP_CARD_SIZES } from "@/lib/images/sizes";

// How many of the first cards already load eagerly in their own components,
// so the warm-up starts after them.
const EAGER_GRID_CARDS = 3;
const EAGER_STRIP_CARDS = 5;
const PARALLEL_DOWNLOADS = 3;
// A visitor who never scrolls still gets their photos warmed, after this long.
const FALLBACK_START_MS = 6000;

type Target = { src: string; sizes: string };

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

function connectionIsTight(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return false;
  return connection.saveData === true || /(^|-)2g$/.test(connection.effectiveType ?? "");
}

// Downloads the bag photos in the background, after the page has finished
// loading and the browser is idle, so they are already cached by the time the
// visitor scrolls to them. It never competes with what is on screen, never
// runs on a slow or data-saving connection, and only asks the CDN (which has
// each resized photo cached) — not the server and not the database.
export default function ImageWarmup({ sources }: { sources: string[] }) {
  useEffect(() => {
    if (connectionIsTight()) return;

    let cancelled = false;

    const queue: Target[] = [
      ...sources.slice(EAGER_STRIP_CARDS).map((src) => ({ src, sizes: STRIP_CARD_SIZES })),
      ...sources.slice(EAGER_GRID_CARDS).map((src) => ({ src, sizes: GRID_CARD_SIZES })),
    ];

    const loadNext = () => {
      const target = queue.shift();
      if (!target || cancelled) return;

      // getImageProps builds the same srcset the <Image> in the card will use,
      // so the browser fetches the identical optimized file.
      const { props } = getImageProps({
        src: target.src,
        alt: "",
        sizes: target.sizes,
        fill: true,
      });

      const image = new Image();
      image.onload = image.onerror = loadNext;
      image.sizes = props.sizes ?? "";
      image.srcset = props.srcSet ?? "";
      image.src = props.src;
    };

    const start = () => {
      for (let i = 0; i < PARALLEL_DOWNLOADS; i++) loadNext();
    };

    // Safari has no requestIdleCallback, so fall back to a short delay.
    const whenIdle = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(start, { timeout: 4000 });
      } else {
        setTimeout(start, 1500);
      }
    };

    // Do not start while the page is still settling. Begin when the visitor
    // first shows they are going to look around (scroll, touch, key), which is
    // exactly when the photos start to matter; or, for someone who just sits on
    // the first screen, after a few quiet seconds.
    const INTENT_EVENTS = ["scroll", "pointerdown", "touchstart", "keydown"] as const;
    let begun = false;
    let fallbackTimer = 0;

    const begin = () => {
      if (begun || cancelled) return;
      begun = true;
      window.clearTimeout(fallbackTimer);
      for (const name of INTENT_EVENTS) window.removeEventListener(name, begin);
      whenIdle();
    };

    const armTriggers = () => {
      for (const name of INTENT_EVENTS) window.addEventListener(name, begin, { passive: true });
      fallbackTimer = window.setTimeout(begin, FALLBACK_START_MS);
    };

    if (document.readyState === "complete") armTriggers();
    else window.addEventListener("load", armTriggers, { once: true });

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("load", armTriggers);
      for (const name of INTENT_EVENTS) window.removeEventListener(name, begin);
    };
  }, [sources]);

  return null;
}

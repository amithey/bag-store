"use client";

import { useEffect } from "react";
import { getImageProps } from "next/image";
import { GRID_CARD_SIZES, STRIP_CARD_SIZES } from "@/lib/images/sizes";

// How many of the first cards already load eagerly in their own components,
// so the warm-up starts after them.
const EAGER_GRID_CARDS = 3;
const EAGER_STRIP_CARDS = 5;
const PARALLEL_DOWNLOADS = 3;

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

    // Wait for the page itself, then for an idle moment.
    const whenIdle = () => {
      // Safari has no requestIdleCallback, so fall back to a short delay.
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(start, { timeout: 4000 });
      } else {
        setTimeout(start, 1500);
      }
    };

    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", whenIdle);
    };
  }, [sources]);

  return null;
}

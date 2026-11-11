import { useState } from "react";
import type { Product } from "@/lib/catalog/types";

// Shared state for every place that shows a bag's photos one at a time
// (the product modal and the product page). Accepts null so the modal can
// call it before an active product exists.
export function useGallery(product: Product | null) {
  const images = product ? (product.images?.length ? product.images : [product.image]) : [];
  // The chosen photo is remembered together with the product it was chosen
  // for. When a different product is shown the choice is dropped during render
  // (the documented way to reset state on a prop change), so the gallery
  // starts on the primary photo without an extra effect-driven re-render.
  const [choice, setChoice] = useState<{ product: Product | null; image: string }>({
    product,
    image: "",
  });
  if (choice.product !== product) setChoice({ product, image: "" });

  const active = choice.product === product ? choice.image : "";
  const setActive = (image: string) => setChoice({ product, image });
  const selected = active || images[0] || "";
  const activeIndex = Math.max(0, images.indexOf(selected));

  const show = (direction: -1 | 1) => {
    if (!images.length) return;
    setActive(images[(activeIndex + direction + images.length) % images.length]);
  };

  return { images, selected, activeIndex, select: setActive, show };
}

export type GalleryState = ReturnType<typeof useGallery>;

import Image from "next/image";
import type { Product } from "@/lib/catalog/types";

type Props = {
  product: Pick<Product, "imageFit">;
  src: string;
  alt: string;
  sizes: string;
  // The one image that decides how fast the page feels (the biggest photo in
  // the first screen). Preloaded and fetched at high priority. Use it for at
  // most one image per page, otherwise they compete and the key one gets slower.
  preload?: boolean;
  // Load immediately instead of waiting to scroll near it. For photos that are
  // likely on screen right away but are not the single most important one.
  eager?: boolean;
  draggable?: boolean;
  // Padding applied in "contain" mode so a whole bag never touches the edge.
  padding?: string;
  // Extra classes (transitions, hover effects) appended to the fit classes.
  className?: string;
};

// The single place that decides how a bag photo fills its frame. The parent
// supplies a positioned, sized box (an aspect-ratio frame); this fills it.
//
// Photos are resized and converted to AVIF/WebP by Next's image optimizer, so
// `sizes` must describe the real rendered width: it is what makes a phone ask
// for a small file instead of the original.
export default function ProductImage({
  product,
  src,
  alt,
  sizes,
  preload,
  eager,
  draggable,
  padding = "p-4",
  className = "",
}: Props) {
  const fit = product.imageFit === "contain" ? `object-contain ${padding}` : "object-cover";

  return (
    <Image
      src={src}
      alt={alt}
      fill
      preload={preload}
      loading={eager && !preload ? "eager" : undefined}
      fetchPriority={preload ? "high" : undefined}
      draggable={draggable}
      sizes={sizes}
      className={`${fit} ${className}`.trim()}
    />
  );
}

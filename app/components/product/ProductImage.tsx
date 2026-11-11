import Image from "next/image";
import type { Product } from "@/lib/catalog/types";

type Props = {
  product: Pick<Product, "imageFit">;
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  draggable?: boolean;
  // Padding applied in "contain" mode so a whole bag never touches the edge.
  padding?: string;
  // Extra classes (transitions, hover effects) appended to the fit classes.
  className?: string;
};

// The single place that decides how a bag photo fills its frame. The parent
// supplies a positioned, sized box (an aspect-ratio frame); this fills it.
export default function ProductImage({
  product,
  src,
  alt,
  sizes,
  priority,
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
      unoptimized
      priority={priority}
      draggable={draggable}
      sizes={sizes}
      className={`${fit} ${className}`.trim()}
    />
  );
}

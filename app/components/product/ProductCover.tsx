import type { Product } from "@/lib/catalog/types";
import { scaleSizes } from "@/lib/images/crop";
import ProductImage from "./ProductImage";

type Props = {
  product: Product;
  // Sizes of the whole cover (the card), not of one photo in it.
  sizes: string;
  eager?: boolean;
  draggable?: boolean;
  // Extra classes (hover effects) for the layer holding the photo(s).
  className?: string;
};

// What a bag shows on a card: one photo, or, when the owner chose it, its first
// two photos together (side by side, or one above the other). Fills the frame
// the parent provides, which is 4:5.
//
// Each half of a pair is itself a frame of its own shape (2:5 side by side,
// 8:5 stacked) with its own saved crop, so both photos can be framed so that
// neither is cut off.
export default function ProductCover({ product, sizes, eager, draggable, className = "" }: Props) {
  const [first, second] = product.images;
  const showPair = product.displayMode === "pair" && Boolean(first) && Boolean(second);

  if (!showPair) {
    return (
      <ProductImage
        product={product}
        src={first ?? product.image}
        alt={product.alt}
        sizes={sizes}
        frame="card"
        eager={eager}
        draggable={draggable}
        className={className}
      />
    );
  }

  const stacked = product.pairLayout === "stacked";
  // Side by side: each photo takes half the width. Stacked: full width.
  const halfSizes = stacked ? sizes : scaleSizes(sizes, 0.5);

  return (
    <div className={`absolute inset-0 flex gap-0.5 ${stacked ? "flex-col" : "flex-row"} ${className}`.trim()}>
      {[first, second].map((src, index) => (
        <div key={src} className="relative flex-1 overflow-hidden">
          <ProductImage
            product={product}
            src={src}
            alt={index === 0 ? product.alt : ""}
            sizes={halfSizes}
            frame={stacked ? "pairStacked" : "pairSide"}
            eager={eager}
            draggable={draggable}
          />
        </div>
      ))}
    </div>
  );
}

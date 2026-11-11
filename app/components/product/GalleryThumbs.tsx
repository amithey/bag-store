import type { Product } from "@/lib/catalog/types";
import ProductImage from "./ProductImage";
import type { GalleryState } from "./useGallery";

// The row of small photos under (or beside) the main one.
export default function GalleryThumbs({
  product,
  gallery,
  padding,
  className = "",
}: {
  product: Product;
  gallery: GalleryState;
  padding?: string;
  className?: string;
}) {
  const { images, selected, select } = gallery;
  if (images.length < 2) return null;

  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 ${className}`.trim()}>
      {images.map((image, index) => (
        <button
          key={image}
          type="button"
          onClick={() => select(image)}
          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-bone ${
            image === selected ? "border-ink ring-2 ring-ink/10" : "border-line"
          }`}
          aria-label={`תמונה ${index + 1} של ${product.name}`}
        >
          <ProductImage product={product} src={image} alt="" sizes="64px" padding={padding} />
        </button>
      ))}
    </div>
  );
}

import type { Product } from "@/lib/catalog/types";
import type { Frame } from "@/lib/images/crop";
import ProductImage from "./ProductImage";
import type { GalleryState } from "./useGallery";

// The large photo plus previous/next arrows. Fills a positioned frame that the
// caller provides, so the modal and the product page can use different shapes.
export default function GalleryMain({
  product,
  gallery,
  sizes,
  controls = true,
  preload = false,
  frame = "card",
}: {
  product: Product;
  gallery: GalleryState;
  sizes: string;
  controls?: boolean;
  // True only where this photo is the main one of the whole page.
  preload?: boolean;
  // "card" applies the owner's saved crop; "full" always shows the whole photo.
  frame?: Frame;
}) {
  const { images, selected, activeIndex, show } = gallery;

  return (
    <>
      <ProductImage product={product} src={selected} alt={product.alt} sizes={sizes} frame={frame} eager preload={preload} />
      {controls && images.length > 1 && (
        <div className="absolute inset-x-5 bottom-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => show(-1)}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/86 text-xl font-bold text-ink backdrop-blur"
            aria-label="תמונה קודמת"
          >
            ‹
          </button>
          <span className="rounded-full bg-white/86 px-4 py-2 text-[12px] font-bold text-ink backdrop-blur">
            {activeIndex + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={() => show(1)}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/86 text-xl font-bold text-ink backdrop-blur"
            aria-label="תמונה הבאה"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}

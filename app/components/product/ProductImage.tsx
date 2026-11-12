import Image from "next/image";
import type { Product } from "@/lib/catalog/types";
import { cropToStyle, isCroppableFrame, scaleSizes, zoomFactor, type Frame } from "@/lib/images/crop";

type Props = {
  // Only the framing settings are needed, so a stand-in object works too.
  product: Pick<Product, "imageSettings">;
  src: string;
  alt: string;
  sizes: string;
  // Which shape this photo is shown in. Decides which saved crop applies.
  frame?: Frame;
  // The one image that decides how fast the page feels (the biggest photo in
  // the first screen). Preloaded and fetched at high priority. Use it for at
  // most one image per page, otherwise they compete and the key one gets slower.
  preload?: boolean;
  // Load immediately instead of waiting to scroll near it. For photos that are
  // likely on screen right away but are not the single most important one.
  eager?: boolean;
  draggable?: boolean;
  // Extra classes (transitions, hover effects) for the layer holding the photo.
  className?: string;
};

// The single place that decides how a bag photo fills its frame. The parent
// supplies a positioned, sized box; this fills it.
//
//  - By default the WHOLE photo is shown, so a bag is never cut off.
//  - If the owner saved a crop for this photo and frame, exactly that part is
//    shown (see lib/images/crop for the maths).
//  - The hero is the one exception: it is a full-bleed picture and fills its
//    frame unless a crop says otherwise.
//
// `sizes` must describe the real rendered width: it makes a phone ask for a
// small file instead of the original. For a zoomed crop it is scaled up so the
// photo does not look soft.
export default function ProductImage({
  product,
  src,
  alt,
  sizes,
  frame = "card",
  preload,
  eager,
  draggable,
  className = "",
}: Props) {
  const setting = frame === "hero" ? undefined : product.imageSettings[src];
  const crop = isCroppableFrame(frame) ? setting?.[frame] : undefined;
  const background = setting?.bg || undefined;

  const common = {
    alt,
    fill: true as const,
    preload,
    loading: eager && !preload ? ("eager" as const) : undefined,
    fetchPriority: preload ? ("high" as const) : undefined,
    draggable,
  };

  return (
    <div className={`absolute inset-0 ${className}`.trim()} style={background ? { background } : undefined}>
      {crop ? (
        <div style={cropToStyle(crop)}>
          <Image {...common} src={src} sizes={scaleSizes(sizes, zoomFactor(crop))} className="object-cover" />
        </div>
      ) : (
        <Image
          {...common}
          src={src}
          sizes={sizes}
          className={frame === "hero" ? "object-cover" : "object-contain"}
        />
      )}
    </div>
  );
}

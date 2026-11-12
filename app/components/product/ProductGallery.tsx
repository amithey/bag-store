"use client";

import type { Product } from "@/lib/catalog/types";
import GalleryMain from "./GalleryMain";
import GalleryThumbs from "./GalleryThumbs";
import { useGallery } from "./useGallery";

// Gallery for the product page: big photo with arrows, thumbnails below.
export default function ProductGallery({ product }: { product: Product }) {
  const gallery = useGallery(product);

  return (
    <div>
      <div className="shimmer relative aspect-[4/5] overflow-hidden rounded-[24px] bg-bone">
        <GalleryMain
          product={product}
          gallery={gallery}
          sizes="(min-width: 768px) 50vw, 100vw"
          preload
        />
      </div>
      <GalleryThumbs product={product} gallery={gallery} className="mt-3" />
    </div>
  );
}

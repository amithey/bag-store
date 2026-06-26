"use client";

import { useState } from "react";

export default function AdminImageManager({ images }: { images: string[] }) {
  const [orderedImages, setOrderedImages] = useState(images);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= orderedImages.length) return;

    setOrderedImages((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const onDrop = (targetImage: string) => {
    if (!draggedImage || draggedImage === targetImage) return;
    const from = orderedImages.indexOf(draggedImage);
    const to = orderedImages.indexOf(targetImage);
    moveImage(from, to);
    setDraggedImage(null);
  };

  if (!orderedImages.length) return null;

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-line bg-cream/60 p-3">
      <input type="hidden" name="orderedImages" value={orderedImages.join("\n")} />
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <p className="eyebrow">תמונות קיימות</p>
        <p className="text-xs leading-6 text-muted">
          התמונה הראשונה היא הראשית. אפשר לגרור או להזיז עם החצים.
        </p>
      </div>

      {orderedImages.map((image, index) => (
        <label
          key={image}
          draggable
          onDragStart={() => setDraggedImage(image)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => onDrop(image)}
          className="grid cursor-grab gap-3 rounded-2xl border border-line bg-white p-3 text-sm text-muted active:cursor-grabbing md:grid-cols-[92px_1fr_auto] md:items-center"
        >
          <img
            src={image}
            alt=""
            className="h-20 w-20 rounded-xl border border-line object-cover"
          />
          <span className="min-w-0">
            <span className="mb-2 block font-bold text-ink">
              {index === 0 ? "תמונה ראשית" : `תמונה ${index + 1}`}
            </span>
            <span className="block break-all text-left" dir="ltr">
              {image}
            </span>
          </span>
          <span className="grid gap-2">
            <span className="flex gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  moveImage(index, index - 1);
                }}
                disabled={index === 0}
                className="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink disabled:opacity-35"
              >
                למעלה
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  moveImage(index, index + 1);
                }}
                disabled={index === orderedImages.length - 1}
                className="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink disabled:opacity-35"
              >
                למטה
              </button>
            </span>
            <span className="flex items-center gap-2 font-bold text-ink">
              <input type="checkbox" name="removeImages" value={image} />
              הסרת תמונה
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

import type { CSSProperties } from "react";

// A rectangle of a photo, in percent of the photo's own width and height.
// It describes which part of the photo is visible inside a frame. Values can be
// negative or above 100: that means the frame is bigger than the photo in that
// direction, and the extra area shows the background colour. So "the whole bag
// with a margin around it" and "zoomed in on the handle" are the same thing.
export type Crop = { x: number; y: number; width: number; height: number };

// Every shape a photo is shown in on the site. Each can be framed differently.
//   card         4:5   grid card, gallery strip, product page photo
//   pairSide     2:5   one half of a two-photo card, photos side by side
//   pairStacked  8:5   one half of a two-photo card, one above the other
//   hero         5:4   big photo at the top of the home page
//   thumb        1:1   small previews (always the whole photo)
//   full         any   the product pop-up (always the whole photo)
export type Frame = "card" | "pairSide" | "pairStacked" | "hero" | "thumb" | "full";

// The frames an owner can adjust. thumb and full always show the whole photo.
export const CROPPABLE_FRAMES = ["card", "pairSide", "pairStacked"] as const;
export type CroppableFrame = (typeof CROPPABLE_FRAMES)[number];

export function isCroppableFrame(frame: Frame): frame is CroppableFrame {
  return (CROPPABLE_FRAMES as readonly string[]).includes(frame);
}

// Positions the photo inside its frame so that exactly `crop` is visible.
//
// The frame shows `width`% of the photo across its full width, so the photo is
// drawn (100 / width) times as wide as the frame, and shifted left by the share
// of it that lies to the left of the visible area. Same for height.
//
// `right` and `bottom` are set to "auto" on purpose. The site is right-to-left,
// and in RTL an absolutely positioned box that has left, width and right set
// follows `right` and ignores `left`, which would push every crop to the wrong
// side on the Hebrew site only.
export function cropToStyle(crop: Crop): CSSProperties {
  return {
    position: "absolute",
    width: `${(100 / crop.width) * 100}%`,
    height: `${(100 / crop.height) * 100}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
    right: "auto",
    bottom: "auto",
  };
}

// A zoomed photo is drawn bigger than its frame, so the browser must be told to
// fetch a bigger file or it looks soft. Multiplies the final size of every
// entry in a `sizes` string: "(min-width: 768px) 280px, 230px" at 2x becomes
// "(min-width: 768px) 560px, 460px". The conditions in front are left alone.
export function scaleSizes(sizes: string, factor: number): string {
  if (factor === 1) return sizes;
  return sizes
    .split(",")
    .map((part) =>
      part.trim().replace(/(\d+(?:\.\d+)?)(vw|px)\s*$/, (_m, amount: string, unit: string) => {
        const scaled = Math.round(parseFloat(amount) * factor * 10) / 10;
        return `${scaled}${unit}`;
      })
    )
    .join(", ");
}

// How much bigger than its frame a cropped photo is drawn, kept within sane limits.
export function zoomFactor(crop: Crop): number {
  return Math.min(4, Math.max(0.25, 100 / crop.width));
}

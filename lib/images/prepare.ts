// Runs in the browser, on a photo the owner has just picked and before it is
// uploaded. It does two things that used to be impossible from the admin:
//
//  1. Shrinks a big phone photo (often 8-12 MB, which the server refuses) to a
//     size that is still sharper than any screen needs, so uploads are fast and
//     never fail for being too large.
//  2. Measures the colour at the photo's edges, so that when the photo is shown
//     whole inside a frame of a different shape the empty bars blend in instead
//     of showing as a box.

export type PreparedPhoto = {
  blob: Blob;
  contentType: string;
  width: number;
  height: number;
  // Edge colour like "#d6c4b2", or null when the photo already fills a 4:5 card.
  background: string | null;
};

const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.86;
const CARD_ASPECT = 4 / 5;
const CARD_TOLERANCE = 0.03;
const EDGE_STRIP = 0.04;

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  // Animated GIFs would lose their animation when redrawn; send them untouched.
  if (file.type === "image/gif") {
    return { blob: file, contentType: "image/gif", width: 0, height: 0, background: null };
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("canvas unavailable");

  // A transparent PNG would turn black as a JPEG, so paint white underneath.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("could not encode photo");

  return {
    blob,
    contentType: "image/jpeg",
    width,
    height,
    background: edgeColour(context, width, height),
  };
}

// Average colour of the outer strips on the sides that will touch the bars:
// left and right for a photo narrower than the card, top and bottom otherwise.
function edgeColour(context: CanvasRenderingContext2D, width: number, height: number): string | null {
  const aspect = width / height;
  if (Math.abs(aspect / CARD_ASPECT - 1) < CARD_TOLERANCE) return null;

  const thickX = Math.max(1, Math.round(width * EDGE_STRIP));
  const thickY = Math.max(1, Math.round(height * EDGE_STRIP));
  const strips =
    aspect < CARD_ASPECT
      ? [
          [0, 0, thickX, height],
          [width - thickX, 0, thickX, height],
        ]
      : [
          [0, 0, width, thickY],
          [0, height - thickY, width, thickY],
        ];

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (const [x, y, w, h] of strips) {
    const { data } = context.getImageData(x, y, w, h);
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
  }
  if (!count) return null;

  const hex = (value: number) => Math.round(value / count).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

// Normalize product images to a uniform 4:5 canvas using each image's own
// background color, so every bag is shown in full at a consistent size with
// no cropping and no mismatched whitespace.
//
// Usage: node scripts/normalize-images.mjs
//
// Originals are backed up once to image-originals/ (outside public/, so they
// are never served) and are the source of truth for re-runs — the script is
// idempotent and never compounds padding/blur.

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
// Pristine originals live outside public/ so they are never served or shipped.
const SRC_DIR = path.join(process.cwd(), "image-originals");

// Target canvas: 4:5 portrait. Matches the grid card aspect-[4/5].
const TARGET_W = 900;
const TARGET_H = 1125;
// Breathing room around the bag (fraction of canvas left as margin).
const MARGIN = 0.07;
// Cream mat tint blended over the blurred backdrop so the sharp bag pops.
const CREAM = { r: 245, g: 240, b: 232 };

const isBagImage = (f) => /^bag_.*\.(jpe?g|png)$/i.test(f);

async function ensureBackup(files) {
  await fs.mkdir(SRC_DIR, { recursive: true });
  for (const f of files) {
    const dest = path.join(SRC_DIR, f);
    try {
      await fs.access(dest);
    } catch {
      await fs.copyFile(path.join(IMAGES_DIR, f), dest);
    }
  }
}

async function main() {
  const all = await fs.readdir(IMAGES_DIR);
  const files = all.filter(isBagImage);

  if (files.length === 0) {
    console.log("No bag_*.jpg images found in", IMAGES_DIR);
    return;
  }

  await ensureBackup(files);

  const innerW = Math.round(TARGET_W * (1 - MARGIN * 2));
  const innerH = Math.round(TARGET_H * (1 - MARGIN * 2));

  // Translucent cream mat blended over the blurred backdrop (muted, lets the
  // sharp bag stand out without a hard rectangular frame).
  const creamLayer = await sharp({
    create: {
      width: TARGET_W,
      height: TARGET_H,
      channels: 4,
      background: { ...CREAM, alpha: 0.45 },
    },
  })
    .png()
    .toBuffer();

  for (const f of files) {
    const srcPath = path.join(SRC_DIR, f); // always normalize from pristine source
    const buf = await fs.readFile(srcPath);

    // Backdrop: a strongly blurred cover-crop of the photo itself → fills the
    // whole 4:5 canvas and blends seamlessly with any background scene.
    const backdrop = await sharp(buf)
      .resize(TARGET_W, TARGET_H, { fit: "cover", position: "centre" })
      .blur(34)
      .toBuffer();

    // Foreground: the whole bag, sharp, fit inside the inner box (no crop).
    const fg = await sharp(buf)
      .resize(innerW, innerH, { fit: "inside", withoutEnlargement: false })
      .toBuffer();

    await sharp(backdrop)
      .composite([
        { input: creamLayer, blend: "over" },
        { input: fg, gravity: "centre" },
      ])
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(path.join(IMAGES_DIR, f.replace(/\.png$/i, ".jpg")));

    console.log(`✓ ${f.padEnd(18)} →  ${TARGET_W}x${TARGET_H} (blur-extend)`);
  }

  console.log(`\nDone. ${files.length} images normalized. Originals in image-originals/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

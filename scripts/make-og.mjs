// One-off generator for the social share (OpenGraph) image.
// Renders a 1200x630 branded card from a product photo + text overlay and
// writes it as a static asset at app/opengraph-image.jpg (Next auto-detects it).
// Run: node scripts/make-og.mjs

import sharp from "sharp";
import path from "path";

const W = 1200;
const H = 630;
const SRC = path.join(process.cwd(), "public", "images", "full", "bag_pattern.jpg");
const OUT = path.join(process.cwd(), "app", "opengraph-image.jpg");

const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#0d0b08" stop-opacity="0.86"/>
      <stop offset="42%" stop-color="#0d0b08" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#0d0b08" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <text x="64" y="486" font-family="Arial, Helvetica, sans-serif" font-size="30"
        fill="#e8c98f" letter-spacing="6">SMADAR HEYMANS</text>
  <text x="60" y="556" font-family="Georgia, 'Times New Roman', serif" font-size="62"
        font-weight="700" fill="#f7f3ec">Handmade crochet bags</text>
  <text x="64" y="600" font-family="Arial, Helvetica, sans-serif" font-size="26"
        fill="#f7f3eccc" letter-spacing="2">Boutique studio · Ashdod</text>
</svg>`);

const base = await sharp(SRC).resize(W, H, { fit: "cover", position: "centre" }).toBuffer();

await sharp(base)
  .composite([{ input: overlay, blend: "over" }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(OUT);

console.log("✓ wrote", OUT, `(${W}x${H})`);

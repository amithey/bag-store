// Gives every bag photo a background colour that matches the photo's own edge,
// so the bars around a photo that is not 4:5 blend in instead of showing as a
// box in the site's beige.
//
//   node scripts/match-photo-backgrounds.mjs            dry run: prints what it found
//   node scripts/match-photo-backgrounds.mjs --apply    saves the colours
//
// Only photos whose shape differs from the 4:5 card frame get a colour (a 4:5
// photo fills the frame, so there is nothing to blend). A colour is never
// overwritten if the owner already chose one. Needs image-settings.sql to have
// been run, because the colours live in the image_settings column.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const FRAME_ASPECT = 4 / 5;
const TOLERANCE = 0.03; // within 3% of 4:5 counts as filling the frame
const STRIP = 0.04; // sample the outer 4% of the relevant edges

await loadEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run: vercel env pull .env.local --environment=production");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: products, error } = await supabase.from("products").select("*").order("id");
if (error) {
  console.error("Could not read products:", error.message);
  process.exit(1);
}
const hasColumn = products.length > 0 && "image_settings" in products[0];
if (apply && !hasColumn) {
  console.error("The image_settings column does not exist yet. Run supabase/image-settings.sql in the Supabase SQL Editor first.");
  process.exit(1);
}

let changed = 0;
for (const product of products) {
  const settings = { ...(hasColumn && product.image_settings && typeof product.image_settings === "object" ? product.image_settings : {}) };
  let touched = false;

  for (const src of [...new Set([product.image, ...(product.images || [])].filter(Boolean))]) {
    let buffer;
    try {
      buffer = await readPhoto(src);
    } catch (e) {
      console.log(`${product.id}  skipped (${e.message}): ${shortName(src)}`);
      continue;
    }

    const { width, height } = await sharp(buffer).metadata();
    const aspect = width / height;
    const label = `${product.id}  ${String(width).padStart(4)}x${String(height).padEnd(4)} aspect ${aspect.toFixed(2)}  ${shortName(src)}`;

    if (Math.abs(aspect / FRAME_ASPECT - 1) < TOLERANCE) {
      console.log(`${label}  fills the 4:5 frame, nothing to match`);
      continue;
    }
    if (settings[src]?.bg) {
      console.log(`${label}  already has a colour (${settings[src].bg}), kept`);
      continue;
    }

    // Narrower than the frame: bars left and right. Wider: bars top and bottom.
    const sides = aspect < FRAME_ASPECT ? "left+right" : "top+bottom";
    const hex = await edgeColour(buffer, width, height, sides);
    console.log(`${label}  bars ${sides.padEnd(10)} -> ${hex}`);
    settings[src] = { ...(settings[src] || {}), bg: hex };
    touched = true;
  }

  if (touched && apply) {
    const { error: saveError } = await supabase.from("products").update({ image_settings: settings }).eq("id", product.id);
    if (saveError) {
      console.error(`  could not save bag ${product.id}:`, saveError.message);
      process.exit(1);
    }
    changed++;
  }
}

console.log(apply ? `\nSaved colours for ${changed} bag(s).` : "\nDry run. Nothing was saved. Re-run with --apply to save these colours.");

async function readPhoto(src) {
  if (src.startsWith("/")) return fs.promises.readFile(path.join(process.cwd(), "public", src));
  const response = await fetch(src);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

// Average colour of the outer strips of the sides that will touch the bars.
async function edgeColour(buffer, width, height, sides) {
  const strips = [];
  const thickX = Math.max(1, Math.round(width * STRIP));
  const thickY = Math.max(1, Math.round(height * STRIP));
  if (sides === "left+right") {
    strips.push({ left: 0, top: 0, width: thickX, height }, { left: width - thickX, top: 0, width: thickX, height });
  } else {
    strips.push({ left: 0, top: 0, width, height: thickY }, { left: 0, top: height - thickY, width, height: thickY });
  }
  let r = 0, g = 0, b = 0;
  for (const region of strips) {
    const { data } = await sharp(buffer).extract(region).resize(1, 1, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    r += data[0]; g += data[1]; b += data[2];
  }
  const hex = (n) => Math.round(n / strips.length).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function shortName(src) {
  return decodeURIComponent(src.split("/").pop()).slice(0, 38);
}

async function loadEnvLocal() {
  let text;
  try {
    text = await fs.promises.readFile(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }
  // `vercel env pull` writes a stray line break at the end of a value as escaped text.
  const BS = String.fromCharCode(92);
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^["'](.*)["']$/, "$1").split(BS + "r").join("").split(BS + "n").join("").trim();
  }
}

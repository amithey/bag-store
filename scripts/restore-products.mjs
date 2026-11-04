// Puts the catalog in recovery/catalog-snapshot.json back into Supabase.
//
// Only for the case where the original Supabase project could not be restored
// (see recovery/README.md). It INSERTS missing bags and never touches a bag
// that already exists, so it cannot overwrite live data and is safe to re-run.
// Dry run by default; pass --apply to write.
import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");

await loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run: vercel env pull .env.local"
  );
  process.exit(1);
}

const snapshot = JSON.parse(
  await fs.readFile(new URL("../recovery/catalog-snapshot.json", import.meta.url), "utf8")
);

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing, error: readError } = await supabase.from("products").select("id");
if (readError) {
  console.error("Could not read the products table:", readError.message);
  process.exit(1);
}

const taken = new Set((existing || []).map((row) => row.id));
// The snapshot is in sort_order order; sort_order itself isn't part of the
// serialized storefront product, so rebuild it with the same 10-step spacing
// the seed data uses.
const rows = snapshot
  .filter((product) => !taken.has(product.id))
  .map((product, index) => ({
    id: product.id,
    name: product.name,
    material: product.material,
    dimensions: product.dimensions,
    price_num: product.priceNum,
    image: product.image,
    images: product.images?.length ? product.images : [product.image],
    image_fit: product.imageFit === "contain" ? "contain" : "cover",
    alt: product.alt,
    stock_status: product.stockStatus,
    description: product.description,
    category: product.category === "hand" ? "hand" : "shoulder",
    is_active: true,
    sort_order: (index + 1) * 10,
  }));

console.log(`snapshot: ${snapshot.length} bags`);
console.log(`already in the database: ${snapshot.length - rows.length}`);
console.log(`to insert: ${rows.length}`);
for (const row of rows) {
  const lost = row.image.startsWith("http") ? "  (photo lives in Supabase Storage)" : "";
  console.log(`  ${row.id}  ₪${row.price_num}  ${row.name}${lost}`);
}

if (!rows.length) {
  console.log("\nNothing to do.");
  process.exit(0);
}

if (!apply) {
  console.log("\nDry run. Re-run with --apply to insert these bags.");
  process.exit(0);
}

const { error: insertError } = await supabase.from("products").insert(rows);
if (insertError) {
  console.error("\nInsert failed:", insertError.message);
  process.exit(1);
}

console.log(`\nInserted ${rows.length} bags.`);
console.log(
  "Bags whose photo pointed at Supabase Storage will show a broken image until " +
    "the photo is re-uploaded from the admin panel."
);

async function loadEnvLocal() {
  let text;
  try {
    text = await fs.readFile(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.trim().replace(/^["'](.*)["']$/, "$1");
  }
}

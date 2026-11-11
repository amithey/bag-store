// Read-only audit of the products table: lists EVERY bag, including the ones
// hidden from the storefront, and reports gaps in the id sequence.
//
// The storefront and the public key only ever see is_active = true rows (RLS),
// so a bag saved as a draft, or hidden from the admin, looks exactly like a bag
// that was deleted. This tells them apart. Writes nothing.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase
  .from("products")
  .select("id,name,price_num,image,is_active,sort_order,created_at,updated_at")
  .order("id", { ascending: true });

if (error) {
  console.error("Could not read the products table:", error.message);
  process.exit(1);
}

const rows = data || [];
const active = rows.filter((r) => r.is_active);
const hidden = rows.filter((r) => !r.is_active);

console.log(`total rows in the database: ${rows.length}`);
console.log(`  shown on the site:        ${active.length}`);
console.log(`  hidden / draft:           ${hidden.length}`);

if (hidden.length) {
  console.log("\nHIDDEN — these exist but the site does not show them.");
  console.log("Tick מוצג באתר in the admin panel to bring one back:");
  for (const r of hidden) {
    const missing = [];
    if (!r.image) missing.push("photo");
    if (!r.price_num) missing.push("price");
    const why = missing.length ? `  [incomplete: ${missing.join(", ")}]` : "";
    console.log(`  ${String(r.id).padEnd(3)} ${String(r.price_num).padStart(4)}  ${r.name}${why}`);
  }
}

// Ids are handed out as max(numeric id) + 1, so a gap means a bag that was
// created at some point and later deleted outright.
const numbers = rows.map((r) => Number(r.id)).filter(Number.isFinite);
const highest = numbers.length ? Math.max(...numbers) : 0;
const present = new Set(numbers);
const gaps = [];
for (let n = 1; n <= highest; n++) if (!present.has(n)) gaps.push(String(n).padStart(2, "0"));

console.log(`\nhighest id ever used: ${String(highest).padStart(2, "0")}`);
if (gaps.length) {
  console.log(`deleted (id gone from the table entirely): ${gaps.join(", ")}`);
  console.log(
    "A deleted bag is not recoverable from here — its row and its uploaded\n" +
      "photo were both removed. It has to be added again from the admin panel."
  );
} else {
  console.log("no gaps: every id ever used is still in the table.");
}

async function loadEnvLocal() {
  let text;
  try {
    text = await fs.promises.readFile(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    // `vercel env pull` writes a stray line break at the end of a value as escaped text.
    process.env[key] = stripEscapedLineBreaks(
      rawValue.trim().replace(/^["'](.*)["']$/, "$1")
    );
  }
}

// `vercel env pull` writes a stray line break at the end of a value as the
// escaped text (backslash + r / n), so it has to be removed explicitly.
function stripEscapedLineBreaks(value) {
  const BS = String.fromCharCode(92);
  return value.split(BS + "r").join("").split(BS + "n").join("").trim();
}

import fs from "node:fs/promises";
import { Client } from "pg";

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL.");
  process.exit(1);
}

const sql = await fs.readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Supabase schema applied.");
} finally {
  await client.end();
}

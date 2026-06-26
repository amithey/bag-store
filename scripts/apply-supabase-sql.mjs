import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const sqlPath = process.argv[2];
const connectionString = process.env.DATABASE_URL;

if (!sqlPath) {
  console.error("Usage: node scripts/apply-supabase-sql.mjs <sql-file>");
  process.exit(1);
}

if (!connectionString) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const absolutePath = path.resolve(sqlPath);
const sql = await fs.readFile(absolutePath, "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied ${sqlPath}`);
} finally {
  await client.end();
}

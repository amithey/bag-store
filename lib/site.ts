// Public site URL, shared by metadata, JSON-LD, sitemap and OG image
// resolution — one source of truth instead of repeating the same fallback
// in every file.
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${siteUrl}${path}`;
}

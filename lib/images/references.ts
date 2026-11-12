// Rules about which photo addresses the admin accepts and how to find a photo's
// file in storage. Shared by every action that saves or deletes photos.

const STORAGE_MARKER = "/storage/v1/object/public/product-images/";

// Only photos that ship with the site, or that live in our own storage, are
// accepted. Anything else coming from a form is ignored.
export function isSafeImageReference(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("/images/")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function uniqueSafeImages(images: string[]): string[] {
  return Array.from(new Set(images.map((image) => image.trim()).filter(isSafeImageReference)));
}

// The path of an uploaded photo inside the storage bucket, or null for a photo
// that is not in our storage (for example the ones that ship with the site).
export function getStoragePathFromPublicUrl(image: string): string | null {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const expectedHost = supabaseUrl ? new URL(supabaseUrl).hostname : "";
    const url = new URL(image);

    if (!expectedHost || url.hostname !== expectedHost) return null;
    if (!url.pathname.includes(STORAGE_MARKER)) return null;

    return decodeURIComponent(url.pathname.split(STORAGE_MARKER)[1] || "") || null;
  } catch {
    return null;
  }
}

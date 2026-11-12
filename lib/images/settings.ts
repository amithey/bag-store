import { z } from "zod";
import type { Crop } from "./crop";

// How the owner wants each photo of a bag to be framed. Stored as JSON in the
// `image_settings` column, keyed by the photo's URL. Everything is optional: a
// photo with no entry (or no crop for a frame) is shown whole.
export type ImageSetting = {
  card?: Crop | null;
  pairSide?: Crop | null;
  pairStacked?: Crop | null;
  // Colour behind the photo where it does not fill the frame, like "#f5f0e8".
  bg?: string | null;
};

export type ImageSettings = Record<string, ImageSetting>;

// The limits are deliberately generous but finite: this JSON arrives from a
// form, and a crazy value should be rejected rather than ever reach CSS.
const coordinate = z.number().finite().min(-400).max(400);
const extent = z.number().finite().min(5).max(500);

const cropSchema = z.object({ x: coordinate, y: coordinate, width: extent, height: extent });

const settingSchema = z.object({
  card: cropSchema.nullish(),
  pairSide: cropSchema.nullish(),
  pairStacked: cropSchema.nullish(),
  bg: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullish(),
});

// Reads the stored JSON without ever throwing. A bad entry is dropped on its
// own, so one corrupt photo setting cannot take the whole catalog down.
export function parseImageSettings(value: unknown): ImageSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: ImageSettings = {};
  for (const [url, raw] of Object.entries(value)) {
    const parsed = settingSchema.safeParse(raw);
    if (parsed.success) result[url] = parsed.data;
  }
  return result;
}

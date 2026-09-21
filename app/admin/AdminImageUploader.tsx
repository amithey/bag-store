"use client";

import { useState, type ChangeEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { createProductImageUpload } from "./actions";

// Uploads chosen photos directly from the browser to Supabase Storage using a
// signed URL from the server, then hands the resulting public URLs to the
// product form through a hidden "uploadedImages" field.
export default function AdminImageUploader({
  onUploadingChange,
}: {
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onUploadingChange(busy);
  };

  const onFilesChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setError("חסרות הגדרות Supabase, אי אפשר להעלות תמונות.");
      return;
    }
    const storage = createClient(url, key).storage.from("product-images");

    setError(null);
    setBusy(true);
    try {
      for (const file of files) {
        const ticket = await createProductImageUpload(file.type, file.size);
        if (!ticket.ok) {
          setError(`${file.name}: ${ticket.error}`);
          continue;
        }

        const { error: uploadError } = await storage.uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type,
          cacheControl: "31536000",
        });
        if (uploadError) {
          setError(`${file.name}: ההעלאה נכשלה. נסי שוב.`);
          continue;
        }

        setUploaded((current) => [...current, ticket.publicUrl]);
      }
    } finally {
      setBusy(false);
      input.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        disabled={uploading}
        onChange={onFilesChosen}
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-[14px] text-ink outline-none focus:border-ink"
      />
      <input type="hidden" name="uploadedImages" value={uploaded.join("\n")} />

      {uploading && <p className="mt-2 text-xs font-bold text-muted">מעלה תמונות...</p>}
      {error && <p className="mt-2 text-xs font-bold text-red-700">{error}</p>}

      {uploaded.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {uploaded.map((image) => (
            <div key={image} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="h-20 w-16 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setUploaded((current) => current.filter((item) => item !== image))}
                className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-cream"
                aria-label="הסרת תמונה"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

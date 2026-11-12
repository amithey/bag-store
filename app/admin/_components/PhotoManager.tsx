"use client";

import { createClient } from "@supabase/supabase-js";
import { useRef, useState, type DragEvent } from "react";
import ProductImage from "@/app/components/product/ProductImage";
import type { Crop, CroppableFrame } from "@/lib/images/crop";
import { preparePhoto } from "@/lib/images/prepare";
import type { ImageSettings } from "@/lib/images/settings";
import { createProductImageUpload } from "../_actions/images";
import FrameEditor from "./FrameEditor";

const MAX_PHOTOS = 12;

// Width divided by height of each frame shape (see lib/images/crop).
const FRAME_ASPECT: Record<CroppableFrame, number> = { card: 4 / 5, pairSide: 2 / 5, pairStacked: 8 / 5 };

type Upload = { key: string; name: string; state: "working" | "failed"; message?: string; file: File };

type Props = {
  images: string[];
  imageSettings: ImageSettings;
  displayMode: "single" | "pair";
  pairLayout: "side" | "stacked";
  // Tells the form that photos are still uploading, so saving waits for them.
  onBusyChange: (busy: boolean) => void;
  onAddPhoto: (url: string, background: string | null) => void;
  onRemovePhoto: (url: string) => void;
  onMakeMain: (url: string) => void;
  onMovePhoto: (url: string, direction: -1 | 1) => void;
  onFrame: (url: string, frame: CroppableFrame, crop: Crop | null, background: string | null) => void;
  onMode: (displayMode: "single" | "pair", pairLayout: "side" | "stacked") => void;
};

export default function PhotoManager(props: Props) {
  const { images, imageSettings, displayMode, pairLayout, onBusyChange } = props;
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ photo: string; frame: CroppableFrame } | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const running = useRef(0);

  const isPair = displayMode === "pair" && images.length >= 2;

  // Which frame shape a photo is shown in on the card.
  const frameFor = (index: number): CroppableFrame => {
    if (isPair && index < 2) return pairLayout === "stacked" ? "pairStacked" : "pairSide";
    return "card";
  };

  const slotLabel = (index: number): string | null => {
    if (!isPair || index > 1) return null;
    if (pairLayout === "stacked") return index === 0 ? "למעלה" : "למטה";
    return index === 0 ? "ימין" : "שמאל";
  };

  const uploadOne = async (upload: Upload) => {
    running.current += 1;
    onBusyChange(true);
    try {
      const prepared = await preparePhoto(upload.file);
      const ticket = await createProductImageUpload(prepared.contentType, prepared.blob.size);
      if (!ticket.ok) throw new Error(ticket.error);

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
      if (!url || !key) throw new Error("חסרות הגדרות להעלאת תמונות.");

      const { error } = await createClient(url, key)
        .storage.from("product-images")
        .uploadToSignedUrl(ticket.path, ticket.token, prepared.blob, {
          contentType: prepared.contentType,
          cacheControl: "31536000",
        });
      if (error) throw new Error("ההעלאה נכשלה. בדקי את החיבור ונסי שוב.");

      props.onAddPhoto(ticket.publicUrl, prepared.background);
      setUploads((current) => current.filter((item) => item.key !== upload.key));
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "לא הצלחנו להעלות את התמונה.";
      setUploads((current) => current.map((item) => (item.key === upload.key ? { ...item, state: "failed", message } : item)));
    } finally {
      running.current -= 1;
      if (running.current === 0) onBusyChange(false);
    }
  };

  const addFiles = (files: File[]) => {
    const pictures = files.filter((file) => file.type.startsWith("image/"));
    if (!pictures.length) return;

    const room = MAX_PHOTOS - images.length - uploads.length;
    if (pictures.length > room) setLimitMessage(`אפשר עד ${MAX_PHOTOS} תמונות לתיק.`);
    else setLimitMessage(null);

    const accepted = pictures.slice(0, Math.max(0, room)).map<Upload>((file) => ({
      key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      state: "working",
      file,
    }));
    if (!accepted.length) return;

    setUploads((current) => [...current, ...accepted]);
    accepted.forEach((upload) => void uploadOne(upload));
  };

  const retry = (upload: Upload) => {
    const again = { ...upload, state: "working" as const, message: undefined };
    setUploads((current) => current.map((item) => (item.key === upload.key ? again : item)));
    void uploadOne(again);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const tileClass = "relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-bone";

  return (
    <div>
      {/* How the bag appears on its card */}
      <div className="mb-5 rounded-2xl border border-line bg-white/60 p-4">
        <p className="text-[14px] font-bold text-ink">איך התיק יופיע בכרטיס באתר?</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <ModeButton
            active={!isPair}
            title="תמונה אחת"
            hint="התמונה הראשית בלבד."
            onClick={() => props.onMode("single", pairLayout)}
          />
          <ModeButton
            active={isPair}
            disabled={images.length < 2}
            title="שתי תמונות יחד"
            hint={images.length < 2 ? "צריך להעלות לפחות שתי תמונות." : "שתי התמונות הראשונות זו ליד זו, או זו מעל זו."}
            onClick={() => props.onMode("pair", pairLayout)}
          />
        </div>
        {isPair && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-bold text-ink">סידור:</span>
            <Chip active={pairLayout === "side"} onClick={() => props.onMode("pair", "side")}>
              זו לצד זו
            </Chip>
            <Chip active={pairLayout === "stacked"} onClick={() => props.onMode("pair", "stacked")}>
              אחת מעל השנייה
            </Chip>
            <span className="text-[12px] text-muted">בחלון התיק מוצגות כל התמונות בגודל מלא.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((photo, index) => {
          const frame = frameFor(index);
          const slot = slotLabel(index);
          const framed = Boolean(imageSettings[photo]?.[frame]);
          return (
            <div key={photo} className="grid gap-2">
              <div className={tileClass}>
                <ProductImage product={{ imageSettings }} src={photo} alt="" sizes="(min-width: 640px) 200px, 45vw" frame={frame} />
                <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap gap-1 p-2">
                  {index === 0 && <Badge dark>ראשית</Badge>}
                  {slot && <Badge>{slot}</Badge>}
                  {framed && <Badge>ממוסגרת</Badge>}
                </div>
                {confirmRemove === photo && (
                  <div className="absolute inset-0 grid place-items-center bg-ink/75 p-3 text-center text-cream">
                    <div>
                      <p className="text-[14px] font-bold">להסיר את התמונה?</p>
                      <div className="mt-3 flex justify-center gap-2">
                        <button type="button" onClick={() => { props.onRemovePhoto(photo); setConfirmRemove(null); }} className="rounded-full bg-red-600 px-4 py-2 text-[13px] font-bold text-white">
                          כן, הסרה
                        </button>
                        <button type="button" onClick={() => setConfirmRemove(null)} className="rounded-full bg-white px-4 py-2 text-[13px] font-bold text-ink">
                          לא
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-1.5">
                <button type="button" onClick={() => setEditing({ photo, frame })} className="button-light rounded-full px-3 py-2.5 text-[12px]">
                  מסגור והזזה
                </button>
                <div className="flex gap-1.5">
                  {index > 0 && (
                    <button type="button" onClick={() => props.onMakeMain(photo)} className="flex-1 rounded-full border border-line bg-white px-2 py-2.5 text-[12px] font-bold text-ink">
                      הפיכה לראשית
                    </button>
                  )}
                  <button type="button" disabled={index === 0} onClick={() => props.onMovePhoto(photo, -1)} className="w-11 rounded-full border border-line bg-white py-2.5 text-[12px] disabled:opacity-35" aria-label="הזזה אחורה ברשימה">
                    ▶
                  </button>
                  <button type="button" disabled={index === images.length - 1} onClick={() => props.onMovePhoto(photo, 1)} className="w-11 rounded-full border border-line bg-white py-2.5 text-[12px] disabled:opacity-35" aria-label="הזזה קדימה ברשימה">
                    ◀
                  </button>
                </div>
                <button type="button" onClick={() => setConfirmRemove(photo)} className="rounded-full px-3 py-2 text-[12px] font-bold text-red-700 hover:underline">
                  הסרה
                </button>
              </div>
            </div>
          );
        })}

        {uploads.map((upload) => (
          <div key={upload.key} className="grid gap-2">
            <div className={`${tileClass} grid place-items-center p-3 text-center`}>
              {upload.state === "working" ? (
                <div>
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ink" />
                  <p className="mt-3 text-[12px] font-bold text-muted">מעלה תמונה...</p>
                </div>
              ) : (
                <div>
                  <p className="text-[13px] font-bold text-red-700">{upload.message}</p>
                  <p className="mt-1 break-all text-[11px] text-muted">{upload.name}</p>
                </div>
              )}
            </div>
            {upload.state === "failed" && (
              <div className="flex gap-1.5">
                <button type="button" onClick={() => retry(upload)} className="button-dark flex-1 rounded-full px-3 py-2.5 text-[12px]">
                  ניסיון חוזר
                </button>
                <button type="button" onClick={() => setUploads((current) => current.filter((item) => item.key !== upload.key))} className="rounded-full border border-line bg-white px-4 py-2.5 text-[12px] font-bold">
                  ביטול
                </button>
              </div>
            )}
          </div>
        ))}

        {images.length + uploads.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => picker.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`grid aspect-[4/5] place-items-center rounded-2xl border-2 border-dashed p-3 text-center transition ${
              dragging ? "border-ink bg-white" : "border-line bg-white/50 hover:border-ink"
            }`}
          >
            <span>
              <span className="block text-[34px] leading-none">＋</span>
              <span className="mt-2 block text-[14px] font-bold text-ink">הוספת תמונות</span>
              <span className="mt-1 block text-[12px] text-muted">לחיצה, או גרירה לכאן</span>
            </span>
          </button>
        )}
      </div>

      <input
        ref={picker}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      {limitMessage && <p className="mt-3 text-[13px] font-bold text-red-700">{limitMessage}</p>}
      {images.length === 0 && uploads.length === 0 && (
        <p className="mt-3 text-[13px] leading-6 text-muted">עוד אין תמונות. התמונה הראשונה שתעלי תהיה התמונה הראשית של התיק.</p>
      )}

      {editing && (
        <FrameEditor
          photo={editing.photo}
          frame={editing.frame}
          aspect={FRAME_ASPECT[editing.frame]}
          title={frameTitle(editing.frame)}
          setting={imageSettings[editing.photo]}
          onClose={() => setEditing(null)}
          onSave={({ crop, background }) => {
            props.onFrame(editing.photo, editing.frame, crop, background);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function frameTitle(frame: CroppableFrame): string {
  if (frame === "pairSide") return "מסגור התמונה (חצי כרטיס, זו לצד זו)";
  if (frame === "pairStacked") return "מסגור התמונה (חצי כרטיס, אחת מעל השנייה)";
  return "מסגור התמונה בכרטיס";
}

function Badge({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${dark ? "bg-ink text-cream" : "bg-white/90 text-ink"}`}>
      {children}
    </span>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-4 py-2.5 text-[12px] font-bold ${active ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink"}`}>
      {children}
    </button>
  );
}

function ModeButton({ active, disabled, title, hint, onClick }: { active: boolean; disabled?: boolean; title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl border p-3 text-right transition disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-ink bg-white ring-2 ring-ink/10" : "border-line bg-white/50 hover:border-ink"}`}
    >
      <span className="block text-[14px] font-bold text-ink">{title}</span>
      <span className="mt-1 block text-[12px] leading-5 text-muted">{hint}</span>
    </button>
  );
}

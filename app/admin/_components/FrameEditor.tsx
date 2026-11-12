"use client";

import { useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, MediaSize, Point } from "react-easy-crop";
import ProductImage from "@/app/components/product/ProductImage";
import type { Crop, CroppableFrame } from "@/lib/images/crop";
import type { ImageSetting } from "@/lib/images/settings";

type Props = {
  photo: string;
  frame: CroppableFrame;
  // Width divided by height of the frame this photo is shown in.
  aspect: number;
  title: string;
  setting: ImageSetting | undefined;
  onSave: (result: { crop: Crop | null; background: string | null }) => void;
  onClose: () => void;
};

const SITE_BEIGE = "#ebe3d5";
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;

const round = (value: number) => Math.round(value * 100) / 100;

// The window where the owner decides how a photo sits inside its frame: move and
// zoom it, add a margin around it, pick the colour behind it. It starts from
// "the whole photo" and the owner only changes what they want to.
export default function FrameEditor({ photo, frame, aspect, title, setting, onSave, onClose }: Props) {
  const existing = setting?.[frame] ?? null;
  const autoBackground = setting?.bg ?? null;

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  // The zoom at which the whole photo fits inside the frame. The cropper's own
  // "1" shows only the middle part of a photo whose shape differs from the frame,
  // so this is worked out from the photo once it has loaded.
  const [wholeZoom, setWholeZoom] = useState(1);
  const [area, setArea] = useState<Crop | null>(existing);
  const [background, setBackground] = useState<string>(autoBackground ?? SITE_BEIGE);
  // Has the owner touched anything? If not, "save" keeps whatever was saved.
  const [touched, setTouched] = useState(false);

  const swatches = [
    ...(autoBackground ? [{ label: "כמו התמונה", color: autoBackground }] : []),
    { label: "בז׳ האתר", color: SITE_BEIGE },
    { label: "לבן", color: "#ffffff" },
    { label: "שחור", color: "#1b1b1b" },
  ];

  const isWhole = !area || (Math.abs(zoom - wholeZoom) < 0.02 && Math.abs(crop.x) < 2 && Math.abs(crop.y) < 2);

  const reset = () => {
    setTouched(true);
    setCrop({ x: 0, y: 0 });
    setZoom(wholeZoom);
    setArea(null);
  };

  const save = () => {
    // Nothing moved and nothing was saved before: it stays "the whole photo".
    const next = touched ? (isWhole ? null : area) : existing;
    onSave({
      crop: next ? { x: round(next.x), y: round(next.y), width: round(next.width), height: round(next.height) } : null,
      background,
    });
  };

  const onMediaLoaded = (media: MediaSize) => {
    const photoShape = media.naturalWidth / media.naturalHeight;
    const fits = Math.min(1, aspect / photoShape, photoShape / aspect);
    setWholeZoom(fits);
    // Start from the whole photo, which is what the site shows when nothing is saved.
    if (!existing && !touched) setZoom(fits);
  };

  const lowestZoom = Math.min(MIN_ZOOM, wholeZoom * 0.6);

  const previewSettings = {
    [photo]: { [frame]: isWhole && touched ? null : area, bg: background },
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/60 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex max-h-[96vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-cream shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-[17px] font-bold text-ink">{title}</p>
            <p className="text-[13px] text-muted">גררי כדי להזיז, והגדילי או הקטינו כדי לראות יותר או פחות מהתמונה.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-white text-lg" aria-label="סגירה">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {/* LTR on purpose: the crop numbers are physical left/top, and the page is RTL. */}
          <div dir="ltr" className="relative h-[46vh] min-h-[300px] overflow-hidden rounded-2xl" style={{ background }}>
            <Cropper
              image={photo}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              minZoom={lowestZoom}
              maxZoom={MAX_ZOOM}
              restrictPosition={false}
              objectFit="contain"
              showGrid={false}
              initialCroppedAreaPercentages={existing ?? undefined}
              onMediaLoaded={onMediaLoaded}
              onCropChange={(value) => {
                setTouched(true);
                setCrop(value);
              }}
              onZoomChange={(value) => {
                setTouched(true);
                setZoom(value);
              }}
              onCropAreaChange={(percent: Area) => setArea({ x: percent.x, y: percent.y, width: percent.width, height: percent.height })}
              style={{ containerStyle: { background } }}
            />
          </div>

          <label className="mt-4 flex items-center gap-3">
            <span className="w-16 shrink-0 text-[13px] font-bold text-ink">זום</span>
            <input
              type="range"
              min={lowestZoom}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(event) => {
                setTouched(true);
                setZoom(Number(event.target.value));
              }}
              className="h-11 flex-1"
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={reset} className="button-light rounded-full px-5 py-3 text-[12px]">
              התמונה כולה
            </button>
            <span className="text-[13px] text-muted">ביטול של כל ההזזות והזום.</span>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[13px] font-bold text-ink">צבע מאחורי התמונה (אם יש שוליים)</p>
            <div className="flex flex-wrap items-center gap-2">
              {swatches.map((swatch) => (
                <button
                  key={swatch.color}
                  type="button"
                  onClick={() => {
                    setTouched(true);
                    setBackground(swatch.color);
                  }}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-bold ${
                    background.toLowerCase() === swatch.color.toLowerCase() ? "border-ink bg-white" : "border-line bg-white/60"
                  }`}
                >
                  <span className="h-5 w-5 rounded-full border border-line" style={{ background: swatch.color }} />
                  {swatch.label}
                </button>
              ))}
              <label className="flex items-center gap-2 rounded-full border border-line bg-white/60 px-3 py-2 text-[12px] font-bold">
                אחר
                <input
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(background) ? background : SITE_BEIGE}
                  onChange={(event) => {
                    setTouched(true);
                    setBackground(event.target.value);
                  }}
                  className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex items-end gap-4 rounded-2xl border border-line bg-white/60 p-3">
            <div className="relative w-24 shrink-0 overflow-hidden rounded-xl bg-bone" style={{ aspectRatio: String(aspect) }}>
              <ProductImage product={{ imageSettings: previewSettings }} src={photo} alt="" sizes="96px" frame={frame} />
            </div>
            <p className="text-[13px] leading-6 text-muted">כך התמונה תיראה במסגרת הזו באתר.</p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-line bg-white/70 px-5 py-4">
          <button type="button" onClick={save} className="button-dark flex-1 rounded-full py-3">
            אישור
          </button>
          <button type="button" onClick={onClose} className="button-light rounded-full px-6 py-3">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

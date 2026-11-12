"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import ProductCover from "@/app/components/product/ProductCover";
import {
  composeFullName,
  missingForPublish,
  parsePrice,
  type ProductInput,
  type SaveResult,
} from "@/lib/admin/product-input";
import type { Product } from "@/lib/catalog/types";
import type { Crop, CroppableFrame } from "@/lib/images/crop";
import { stockStateLabels, getStockStatusFromState, type ProductStockState } from "@/lib/productStock";
import { deleteProduct, saveProduct } from "../_actions/products";
import PhotoManager from "./PhotoManager";

const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-muted/60 focus:border-ink";

const stockOptions: ProductStockState[] = ["ready", "made_to_order", "last", "sold_out", "custom"];

type Banner = { tone: "good" | "warn" | "bad"; text: string; link?: { href: string; label: string } };

export default function ProductEditor({ initial, justCreated = false }: { initial: ProductInput; justCreated?: boolean }) {
  const router = useRouter();
  const [input, setInput] = useState<ProductInput>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(
    justCreated ? { tone: "good", text: "התיק נוצר ונשמר.", link: undefined } : null
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isNew = !input.id;
  const missing = useMemo(() => missingForPublish(input), [input]);
  const canPublish = missing.length === 0;

  // Warn before closing the tab or navigating away with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (patch: Partial<ProductInput>) => {
    setInput((current) => ({ ...current, ...patch }));
    setDirty(true);
    setBanner(null);
  };

  const changeFunctional = (update: (current: ProductInput) => ProductInput) => {
    setInput(update);
    setDirty(true);
    setBanner(null);
  };

  // ---- photos ----
  const addPhoto = (url: string, background: string | null) =>
    changeFunctional((current) => ({
      ...current,
      images: current.images.includes(url) ? current.images : [...current.images, url],
      imageSettings: background
        ? { ...current.imageSettings, [url]: { ...current.imageSettings[url], bg: background } }
        : current.imageSettings,
    }));

  const removePhoto = (url: string) =>
    changeFunctional((current) => {
      const images = current.images.filter((photo) => photo !== url);
      const imageSettings = { ...current.imageSettings };
      delete imageSettings[url];
      return { ...current, images, imageSettings, displayMode: images.length < 2 ? "single" : current.displayMode };
    });

  const makeMain = (url: string) =>
    changeFunctional((current) => ({ ...current, images: [url, ...current.images.filter((photo) => photo !== url)] }));

  const movePhoto = (url: string, direction: -1 | 1) =>
    changeFunctional((current) => {
      const images = [...current.images];
      const from = images.indexOf(url);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= images.length) return current;
      [images[from], images[to]] = [images[to], images[from]];
      return { ...current, images };
    });

  const setFrame = (url: string, frame: CroppableFrame, crop: Crop | null, background: string | null) =>
    changeFunctional((current) => ({
      ...current,
      imageSettings: {
        ...current.imageSettings,
        [url]: { ...current.imageSettings[url], [frame]: crop, ...(background ? { bg: background } : {}) },
      },
    }));

  // ---- saving ----
  const save = async () => {
    if (saving || uploading) return;
    setSaving(true);
    setBanner(null);

    let result: SaveResult;
    try {
      result = await saveProduct(input);
    } catch {
      result = { ok: false, message: "השמירה נכשלה. בדקי את החיבור ונסי שוב." };
    }
    setSaving(false);

    if (!result.ok) {
      setBanner({ tone: "bad", text: result.message });
      return;
    }

    setDirty(false);
    setInput((current) => ({ ...current, id: result.id, isActive: result.published }));

    if (isNew) {
      router.replace(`/admin/products/${result.id}?created=1`);
      return;
    }

    setBanner(
      result.notice
        ? { tone: "warn", text: result.notice }
        : result.published
          ? { tone: "good", text: "נשמר, והתיק מוצג באתר.", link: { href: `/product/${result.id}`, label: "צפייה בדף התיק באתר" } }
          : { tone: "good", text: "נשמר. התיק מוסתר ולא מוצג באתר." }
    );
    router.refresh();
  };

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    const result = await deleteProduct(input.id).catch(() => ({ ok: false as const, message: "המחיקה נכשלה." }));
    if (!result.ok) {
      setDeleting(false);
      setConfirmDelete(false);
      setBanner({ tone: "bad", text: result.message });
      return;
    }
    setDirty(false);
    router.replace("/admin/products");
  };

  // ---- live preview ----
  const preview = useMemo<Product>(() => {
    const price = parsePrice(input.price);
    return {
      id: input.id || "—",
      name: composeFullName(input) || "שם התיק",
      material: input.material,
      dimensions: input.dimensions,
      price: price ? `₪${price.toLocaleString("he-IL")}` : "₪",
      priceNum: price,
      image: input.images[0] ?? "",
      images: input.images,
      alt: input.name,
      stockStatus: getStockStatusFromState(input.stockState, input.stockText),
      description: input.description,
      category: input.category,
      imageSettings: input.imageSettings,
      displayMode: input.displayMode,
      pairLayout: input.pairLayout,
    };
  }, [input]);

  const bannerTone = {
    good: "border-green-300 bg-green-50 text-green-900",
    warn: "border-amber-300 bg-amber-50 text-amber-900",
    bad: "border-red-300 bg-red-50 text-red-900",
  };

  return (
    <div className="pb-28">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/products" className="text-[13px] font-bold text-muted hover:text-ink">
            ← חזרה לכל התיקים
          </Link>
          <h1 className="mt-2 text-[30px] font-semibold leading-tight md:text-[38px]">
            {isNew ? "תיק חדש" : input.name || "עריכת תיק"}
          </h1>
        </div>
        {!isNew && (
          <Link href={`/product/${input.id}`} target="_blank" className="button-light rounded-full px-5 py-3 text-[12px]">
            צפייה בדף באתר ↗
          </Link>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="grid gap-6">
          <Section number="1" title="תמונות" hint="התחילי מכאן. התמונה הראשונה היא זו שמופיעה בכרטיס.">
            <PhotoManager
              images={input.images}
              imageSettings={input.imageSettings}
              displayMode={input.displayMode}
              pairLayout={input.pairLayout}
              onBusyChange={setUploading}
              onAddPhoto={addPhoto}
              onRemovePhoto={removePhoto}
              onMakeMain={makeMain}
              onMovePhoto={movePhoto}
              onFrame={setFrame}
              onMode={(displayMode, pairLayout) => change({ displayMode, pairLayout })}
            />
          </Section>

          <Section number="2" title="פרטי התיק">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="שם התיק" className="md:col-span-2">
                <input value={input.name} onChange={(event) => change({ name: event.target.value })} placeholder="למשל: תיק דגם נינה" className={inputClass} />
              </Field>

              <Field label="מחיר" hint="בשקלים, מספר שלם.">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-[15px] text-muted">₪</span>
                  <input
                    value={input.price}
                    onChange={(event) => change({ price: event.target.value })}
                    inputMode="numeric"
                    placeholder="250"
                    className={`${inputClass} pr-10`}
                  />
                </div>
              </Field>

              <Field label="סוג התיק">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["shoulder", "תיק כתף"],
                      ["hand", "תיק יד"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => change({ category: value })}
                      className={`rounded-2xl border px-4 py-3.5 text-[14px] font-bold ${input.category === value ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="חומר">
                <input value={input.material} onChange={(event) => change({ material: event.target.value })} placeholder="למשל: חוט קשיח בצבע שמנת" className={inputClass} />
              </Field>

              <Field label="מידות">
                <input value={input.dimensions} onChange={(event) => change({ dimensions: event.target.value })} placeholder="למשל: 23x20 ס״מ" className={inputClass} />
              </Field>

              <Field label="תיאור" className="md:col-span-2" hint={`${input.description.length} תווים. בדרך כלל שניים-שלושה משפטים מספיקים.`}>
                <textarea
                  value={input.description}
                  onChange={(event) => change({ description: event.target.value })}
                  rows={4}
                  placeholder="תיאור קצר של התיק: איך הוא נראה, למה הוא מתאים."
                  className={`${inputClass} resize-none leading-7`}
                />
              </Field>

              <details className="md:col-span-2">
                <summary className="cursor-pointer text-[13px] font-bold text-muted">שם באנגלית (לא חובה)</summary>
                <div className="mt-3">
                  <input value={input.nameEn} onChange={(event) => change({ nameEn: event.target.value })} placeholder="Nina" dir="ltr" className={inputClass} />
                  <p className="mt-2 text-[12px] text-muted">מופיע מתחת לשם בעברית בחלון התיק.</p>
                </div>
              </details>
            </div>
          </Section>

          <Section number="3" title="זמינות">
            <div className="flex flex-wrap gap-2">
              {stockOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => change({ stockState: option })}
                  className={`rounded-full border px-4 py-3 text-[13px] font-bold ${input.stockState === option ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink"}`}
                >
                  {stockStateLabels[option]}
                </button>
              ))}
            </div>
            {input.stockState === "custom" && (
              <input value={input.stockText} onChange={(event) => change({ stockText: event.target.value })} placeholder="הטקסט שיופיע בכרטיס" className={`${inputClass} mt-3`} />
            )}
          </Section>

          <Section number="4" title="פרסום באתר">
            <label className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${canPublish ? "border-line bg-white" : "border-line bg-white/50"}`}>
              <span>
                <span className="block text-[15px] font-bold text-ink">להציג את התיק באתר</span>
                <span className="mt-1 block text-[13px] leading-6 text-muted">
                  {canPublish ? (input.isActive ? "התיק מוצג ללקוחות." : "התיק מוסתר. הפעילי כדי שיופיע באתר.") : "אי אפשר להציג עדיין. חסר:"}
                </span>
                {!canPublish && <span className="mt-1 block text-[13px] font-bold text-amber-800">{missing.join(" · ")}</span>}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={input.isActive && canPublish}
                disabled={!canPublish}
                onClick={() => change({ isActive: !input.isActive })}
                className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${input.isActive && canPublish ? "bg-green-600" : "bg-line"}`}
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${input.isActive && canPublish ? "right-1" : "right-7"}`} />
              </button>
            </label>
          </Section>

          {!isNew && (
            <div className="rounded-3xl border border-red-200 bg-red-50/50 p-5">
              <p className="text-[14px] font-bold text-red-900">מחיקת התיק</p>
              <p className="mt-1 text-[13px] leading-6 text-red-900/80">
                אם רק רוצים שהתיק לא יופיע באתר, מספיק לכבות את &quot;להציג את התיק באתר&quot; למעלה. מחיקה היא סופית.
              </p>
              <button type="button" onClick={() => setConfirmDelete(true)} className="mt-3 rounded-full border border-red-300 bg-white px-5 py-3 text-[13px] font-bold text-red-700">
                מחיקה לצמיתות
              </button>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24">
          <p className="mb-2 text-[13px] font-bold text-ink">כך הכרטיס ייראה באתר</p>
          <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[26px] bg-white shadow-sm ring-1 ring-line/60">
            <div className="relative aspect-[4/5] overflow-hidden bg-bone">
              {input.images.length ? (
                <ProductCover product={preview} sizes="300px" eager />
              ) : (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-[13px] text-muted">עוד אין תמונה</div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-80" />
              <div className="absolute right-4 top-4 rounded-full bg-white/88 px-4 py-2 text-[11px] font-bold text-ink backdrop-blur-md">{preview.price}</div>
              <div className="absolute bottom-4 left-4 right-4 text-cream">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cream/72">דגם {preview.id}</p>
                <h3 className="mt-1 text-[22px] font-semibold leading-tight">{input.name || "שם התיק"}</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="line-clamp-3 text-[13px] leading-6 text-muted">{input.description || "התיאור יופיע כאן."}</p>
              <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3 text-[12px] font-bold">
                <span className="text-taupe">{preview.stockStatus}</span>
                <span className="text-ink">{input.dimensions}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Save bar: always in reach, always says what is going on */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur md:pb-3 max-md:bottom-[68px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <button type="button" onClick={save} disabled={saving || uploading} className="button-dark rounded-full px-8 py-3.5 disabled:opacity-50">
            {saving ? "שומר..." : uploading ? "ממתין להעלאת התמונות..." : isNew ? "יצירת התיק" : "שמירה"}
          </button>
          <div className="min-w-0 flex-1 text-[13px] leading-6">
            {banner ? (
              <span className={`inline-flex flex-wrap items-center gap-x-3 rounded-2xl border px-4 py-2 font-bold ${bannerTone[banner.tone]}`}>
                <span>{banner.tone === "good" ? "✓ " : ""}{banner.text}</span>
                {banner.link && (
                  <Link href={banner.link.href} target="_blank" className="underline underline-offset-4">
                    {banner.link.label}
                  </Link>
                )}
              </span>
            ) : dirty ? (
              <span className="font-bold text-amber-800">יש שינויים שעדיין לא נשמרו.</span>
            ) : (
              <span className="text-muted">{isNew ? "מלאי את הפרטים ולחצי על יצירת התיק." : "הכל שמור."}</span>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-2xl">
            <p className="text-[20px] font-bold">למחוק את התיק לצמיתות?</p>
            <p className="mt-2 text-[14px] leading-7 text-muted">
              &quot;{input.name || "התיק"}&quot; והתמונות שלו יימחקו ולא ניתן לשחזר אותם. כדי רק להוריד אותו מהאתר, השתמשי בכיבוי של &quot;להציג את התיק באתר&quot;.
            </p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={remove} disabled={deleting} className="flex-1 rounded-full bg-red-600 py-3.5 text-[14px] font-bold text-white disabled:opacity-50">
                {deleting ? "מוחק..." : "כן, למחוק"}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="button-light rounded-full px-6 py-3.5">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ number, title, hint, children }: { number: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white/70 p-5 md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-bold text-cream">{number}</span>
        <div>
          <h2 className="text-[19px] font-semibold leading-8">{title}</h2>
          {hint && <p className="text-[13px] leading-6 text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[14px] font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

"use client";

import type { ProductRow } from "@/lib/supabaseProducts";
import { getStockState, stockStateLabels } from "@/lib/productStock";
import AdminImageManager from "./AdminImageManager";
import { deleteProduct, hideProduct, saveProduct } from "./actions";

const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-[14px] text-ink outline-none focus:border-ink";

export default function ProductForm({ product }: { product?: ProductRow }) {
  const isEdit = Boolean(product);
  const imageList = product?.images?.length ? product.images : product?.image ? [product.image] : [];
  const stockState = getStockState(product?.stock_status || "");

  return (
    <div className="rounded-3xl border border-line bg-white/80 p-5 shadow-sm">
      <form action={saveProduct} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="id" value={product?.id || ""} />
        <input type="hidden" name="existingImage" value={product?.image || ""} />
        <input type="hidden" name="existingImages" value={imageList.join("\n")} />

        <div>
          <label className="eyebrow mb-2 block">שם התיק</label>
          <input name="name" defaultValue={product?.name} required={isEdit} className={inputClass} />
        </div>

        <div>
          <label className="eyebrow mb-2 block">מחיר</label>
          <input name="priceNum" type="number" min="1" defaultValue={product?.price_num} required={isEdit} className={inputClass} />
        </div>

        <div>
          <label className="eyebrow mb-2 block">קטגוריה</label>
          <select name="category" defaultValue={product?.category || "shoulder"} className={inputClass}>
            <option value="shoulder">תיק כתף</option>
            <option value="hand">תיק יד</option>
          </select>
        </div>

        <div>
          <label className="eyebrow mb-2 block">סדר תצוגה</label>
          <input name="sortOrder" type="number" defaultValue={product?.sort_order || 999} className={inputClass} />
        </div>

        <div>
          <label className="eyebrow mb-2 block">חומר</label>
          <input name="material" defaultValue={product?.material} required={isEdit} className={inputClass} />
        </div>

        <div>
          <label className="eyebrow mb-2 block">מידות</label>
          <input name="dimensions" defaultValue={product?.dimensions} required={isEdit} className={inputClass} />
        </div>

        <div>
          <label className="eyebrow mb-2 block">מצב מלאי</label>
          <select name="stockState" defaultValue={stockState} className={inputClass}>
            <option value="ready">{stockStateLabels.ready}</option>
            <option value="made_to_order">{stockStateLabels.made_to_order}</option>
            <option value="last">{stockStateLabels.last}</option>
            <option value="sold_out">{stockStateLabels.sold_out}</option>
            <option value="custom">{stockStateLabels.custom}</option>
          </select>
        </div>

        <div>
          <label className="eyebrow mb-2 block">טקסט מלאי מותאם</label>
          <input
            name="stockStatus"
            defaultValue={product?.stock_status || ""}
            placeholder="רק אם בחרת טקסט מותאם"
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className="eyebrow mb-2 block">תמונות</label>
          <input name="imageFiles" type="file" accept="image/*" multiple className={inputClass} />
          <input
            name="imageUrl"
            type="text"
            placeholder="קישור לתמונה חדשה, אם יש /images/bag_brown.jpg"
            className={`${inputClass} mt-3`}
          />
          <textarea
            name="imageUrls"
            rows={3}
            placeholder="תמונות נוספות, כל קישור בשורה נפרדת"
            className={`${inputClass} mt-3 resize-none`}
          />
          <AdminImageManager images={imageList} />
        </div>

        <div className="md:col-span-2">
          <label className="eyebrow mb-2 block">תיאור</label>
          <textarea name="description" defaultValue={product?.description} required={isEdit} rows={4} className={`${inputClass} resize-none`} />
        </div>

        <label className="flex items-center gap-3 text-sm font-bold text-ink">
          <input name="isActive" type="checkbox" defaultChecked={product?.is_active ?? true} />
          להציג באתר
        </label>

        {!isEdit && (
          <p className="text-sm leading-7 text-muted md:col-span-2">
            בהוספת תיק חדש אפשר לשמור גם בלי למלא הכל. אם חסרים פרטים חשובים או תמונה, התיק יישמר כטיוטה ולא יוצג באתר עד השלמה.
          </p>
        )}

        <div className="flex gap-3 md:justify-end">
          <button type="submit" className="button-dark rounded-full px-6 py-3">
            {isEdit ? "שמירת שינויים" : "הוספת תיק"}
          </button>
        </div>
      </form>

      {product && (
        <div className="mt-3 grid gap-3 border-t border-line pt-3 md:grid-cols-2">
          <form action={hideProduct}>
            <input type="hidden" name="id" value={product.id} />
            <button type="submit" className="text-sm font-bold text-muted underline-offset-4 hover:text-ink hover:underline">
              הסתרה מהאתר
            </button>
          </form>

          <form action={deleteProduct} className="rounded-2xl border border-red-200 bg-red-50/60 p-3">
            <input type="hidden" name="id" value={product.id} />
            <label className="mb-3 flex items-center gap-2 text-xs font-bold text-red-900">
              <input type="checkbox" name="confirmDelete" required />
              אני מבינה שהמחיקה היא לצמיתות
            </label>
            <button type="submit" className="text-sm font-bold text-red-700 underline-offset-4 hover:underline">
              מחיקת פריט לצמיתות
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

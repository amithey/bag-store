"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import ProductCover from "@/app/components/product/ProductCover";
import { missingForPublish, rowToInput } from "@/lib/admin/product-input";
import { getHebrewName } from "@/lib/catalog/names";
import { rowToProduct } from "@/lib/catalog/mappers";
import type { ProductRow } from "@/lib/catalog/types";
import { isSoldOut } from "@/lib/productStock";
import { reorderProducts, setProductVisibility } from "../_actions/products";

type Filter = "all" | "visible" | "hidden" | "soldout";

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "הכל" },
  { value: "visible", label: "מוצגים באתר" },
  { value: "hidden", label: "מוסתרים וטיוטות" },
  { value: "soldout", label: "אזלו" },
];

export default function ProductList({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  // Visibility the owner just changed, shown immediately while the server catches up.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const [, startTransition] = useTransition();

  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState<string[]>(() => products.map((product) => product.id));
  const [savingOrder, setSavingOrder] = useState(false);

  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const isVisible = (row: ProductRow) => overrides[row.id] ?? row.is_active;

  const rows = useMemo(() => {
    const ordered = (reordering ? order : products.map((product) => product.id))
      .map((id) => byId.get(id))
      .filter((row): row is ProductRow => Boolean(row));
    if (reordering) return ordered;

    const cleanQuery = query.trim().toLowerCase();
    return ordered.filter((row) => {
      const visible = overrides[row.id] ?? row.is_active;
      const matchesQuery =
        !cleanQuery ||
        [row.id, row.name, row.material, row.description].join(" ").toLowerCase().includes(cleanQuery);
      const matchesFilter =
        filter === "all" ||
        (filter === "visible" && visible) ||
        (filter === "hidden" && !visible) ||
        (filter === "soldout" && isSoldOut(row.stock_status));
      return matchesQuery && matchesFilter;
    });
  }, [byId, filter, order, overrides, products, query, reordering]);

  const toggle = (row: ProductRow) => {
    const next = !isVisible(row);
    setMessage(null);
    setOverrides((current) => ({ ...current, [row.id]: next }));
    startTransition(async () => {
      const result = await setProductVisibility(row.id, next).catch(() => ({ ok: false as const, message: "העדכון נכשל. נסי שוב." }));
      if (!result.ok) {
        setOverrides((current) => ({ ...current, [row.id]: !next }));
        setMessage({ tone: "bad", text: result.message });
        return;
      }
      setMessage({
        tone: "good",
        text: next ? `"${getHebrewName(row.name)}" מוצג עכשיו באתר.` : `"${getHebrewName(row.name)}" הוסתר מהאתר.`,
      });
    });
  };

  const move = (id: string, direction: -1 | 1) =>
    setOrder((current) => {
      const next = [...current];
      const from = next.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= next.length) return current;
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });

  const saveOrder = async () => {
    setSavingOrder(true);
    const result = await reorderProducts(order).catch(() => ({ ok: false as const, message: "שמירת הסדר נכשלה." }));
    setSavingOrder(false);
    if (!result.ok) {
      setMessage({ tone: "bad", text: result.message });
      return;
    }
    setReordering(false);
    setMessage({ tone: "good", text: "הסדר נשמר. כך התיקים מופיעים באתר." });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[30px] font-semibold leading-tight md:text-[38px]">
          התיקים שלי <span className="text-[20px] text-muted">({products.length})</span>
        </h1>
        <Link href="/admin/products/new" className="button-dark rounded-full px-7 py-4 text-[13px]">
          ＋ תיק חדש
        </Link>
      </div>

      {message && (
        <p className={`mt-4 rounded-2xl border px-4 py-3 text-[14px] font-bold ${message.tone === "good" ? "border-green-300 bg-green-50 text-green-900" : "border-red-300 bg-red-50 text-red-900"}`}>
          {message.tone === "good" ? "✓ " : ""}
          {message.text}
        </p>
      )}

      {reordering ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white/70 p-4">
          <p className="flex-1 text-[14px] font-bold text-ink">שינוי סדר: הזיזי תיקים עם החצים. הראשון יופיע ראשון באתר.</p>
          <button type="button" onClick={saveOrder} disabled={savingOrder} className="button-dark rounded-full px-6 py-3 text-[12px] disabled:opacity-50">
            {savingOrder ? "שומר..." : "שמירת הסדר"}
          </button>
          <button
            type="button"
            onClick={() => {
              setReordering(false);
              setOrder(products.map((product) => product.id));
            }}
            className="button-light rounded-full px-6 py-3 text-[12px]"
          >
            ביטול
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="חיפוש לפי שם, מספר דגם או חומר..."
            className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-[15px] outline-none focus:border-ink"
          />
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-full border px-4 py-2.5 text-[13px] font-bold ${filter === item.value ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink"}`}
              >
                {item.label}
              </button>
            ))}
            <button type="button" onClick={() => setReordering(true)} className="mr-auto rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink">
              ⇅ שינוי סדר
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-line bg-white/70 p-8 text-center text-muted">
          {products.length === 0 ? "עוד אין תיקים. לחצי על ״תיק חדש״ כדי להתחיל." : "לא נמצאו תיקים שמתאימים."}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {rows.map((row, index) => (
            <Tile
              key={row.id}
              row={row}
              visible={isVisible(row)}
              reordering={reordering}
              first={index === 0}
              last={index === rows.length - 1}
              onToggle={() => toggle(row)}
              onMove={(direction) => move(row.id, direction)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Tile({
  row,
  visible,
  reordering,
  first,
  last,
  onToggle,
  onMove,
}: {
  row: ProductRow;
  visible: boolean;
  reordering: boolean;
  first: boolean;
  last: boolean;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const product = rowToProduct(row);
  const missing = missingForPublish(rowToInput(row));
  const draft = !visible && missing.length > 0;

  const cover = (
    <div className="relative aspect-[4/5] overflow-hidden bg-bone">
      {product.images.length ? (
        <ProductCover product={product} sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 45vw" eager />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-[12px] text-muted">אין תמונה</div>
      )}
      <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink">{product.price}</span>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white/80 shadow-sm">
      {reordering ? (
        <div>{cover}</div>
      ) : (
        <Link href={`/admin/products/${row.id}`} className="block">
          {cover}
        </Link>
      )}

      <div className="p-3">
        <p className="truncate text-[15px] font-bold text-ink">{getHebrewName(row.name)}</p>

        {reordering ? (
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={first} onClick={() => onMove(-1)} className="flex-1 rounded-full border border-line bg-white py-3 text-[14px] font-bold disabled:opacity-30" aria-label="הזזה אחורה">
              ▶
            </button>
            <button type="button" disabled={last} onClick={() => onMove(1)} className="flex-1 rounded-full border border-line bg-white py-3 text-[14px] font-bold disabled:opacity-30" aria-label="הזזה קדימה">
              ◀
            </button>
          </div>
        ) : (
          <>
            <p className={`mt-1 text-[12px] font-bold ${visible ? "text-green-700" : draft ? "text-amber-700" : "text-muted"}`}>
              {visible ? "● מוצג באתר" : draft ? `● טיוטה · חסר: ${missing.join(", ")}` : "● מוסתר"}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[12px] text-muted">{draft ? "להשלמה" : "להציג באתר"}</span>
              {draft ? (
                <Link href={`/admin/products/${row.id}`} className="rounded-full bg-amber-100 px-4 py-2 text-[12px] font-bold text-amber-900">
                  השלמה
                </Link>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={visible}
                  aria-label={visible ? "הסתרה מהאתר" : "הצגה באתר"}
                  onClick={onToggle}
                  className={`relative h-8 w-14 shrink-0 rounded-full transition ${visible ? "bg-green-600" : "bg-line"}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${visible ? "right-1" : "right-7"}`} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

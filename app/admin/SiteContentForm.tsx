import type { SiteContent } from "@/lib/siteContent";
import { saveSiteContentAction } from "./actions";

const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-[14px] text-ink outline-none focus:border-ink";

export default function SiteContentForm({ content }: { content: SiteContent }) {
  return (
    <form action={saveSiteContentAction} className="grid gap-4 rounded-3xl border border-line bg-white/80 p-5 shadow-sm md:grid-cols-2">
      <div>
        <label className="eyebrow mb-2 block">כותרת ראשית - שורה 1</label>
        <input name="heroTitleLine1" defaultValue={content.heroTitleLine1} className={inputClass} />
      </div>

      <div>
        <label className="eyebrow mb-2 block">כותרת ראשית - שורה 2</label>
        <input name="heroTitleLine2" defaultValue={content.heroTitleLine2} className={inputClass} />
      </div>

      <div className="md:col-span-2">
        <label className="eyebrow mb-2 block">טקסט פתיחה</label>
        <textarea name="heroBody" defaultValue={content.heroBody} rows={3} className={`${inputClass} resize-none`} />
      </div>

      <div className="md:col-span-2">
        <label className="eyebrow mb-2 block">כותרת הקולקציה</label>
        <input name="collectionTitle" defaultValue={content.collectionTitle} className={inputClass} />
      </div>

      <div className="md:col-span-2">
        <label className="eyebrow mb-2 block">משפט אמון לפני הזמנה</label>
        <textarea name="trustNote" defaultValue={content.trustNote} rows={3} className={`${inputClass} resize-none`} />
      </div>

      <div className="md:col-span-2">
        <label className="eyebrow mb-2 block">טקסט קצר על התהליך</label>
        <textarea name="processBody" defaultValue={content.processBody} rows={3} className={`${inputClass} resize-none`} />
      </div>

      <div className="md:col-span-2 md:text-left">
        <button type="submit" className="button-dark rounded-full px-6 py-3">
          שמירת טקסטים
        </button>
      </div>
    </form>
  );
}

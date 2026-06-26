import Logo from "./Logo";
import {
  SMADAR_EMAIL,
  SMADAR_PHONE_DISPLAY,
  SMADAR_WHATSAPP,
} from "@/lib/orderConstants";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-[#0f0f0f] text-cream">
      <div className="mx-auto max-w-editorial px-5 py-14 md:px-10 md:py-18">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo size="lg" />
            <p className="mt-6 max-w-sm text-[16px] leading-8 text-cream/72">
              תיקי סריגה בעבודת יד, במהדורות קטנות, עם תשומת לב לחומר, צורה וגימור.
            </p>
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold">סטודיו</p>
            <p className="mt-4 text-[15px] leading-7 text-cream/78">
              אשדוד והסביבה
              <br />
              בתיאום אישי מראש
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold">קשר</p>
            <ul className="mt-4 space-y-3 text-[15px] text-cream/78">
              <li>
                <a href={`mailto:${SMADAR_EMAIL}`} className="link-underline" dir="ltr">
                  {SMADAR_EMAIL}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${SMADAR_WHATSAPP}`} target="_blank" rel="noreferrer" className="link-underline" dir="ltr">
                  {SMADAR_PHONE_DISPLAY}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-cream/12 pt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-cream/45 md:flex-row">
          <p>© {year} smadar heymans. כל הזכויות שמורות.</p>
          <p>Handmade in Ashdod</p>
        </div>
      </div>
    </footer>
  );
}

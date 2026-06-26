import type { Metadata } from "next";
import AdminLogin from "./AdminLogin";
import AdminProductsPanel from "./AdminProductsPanel";
import OrdersPanel from "./OrdersPanel";
import ProductForm from "./ProductForm";
import SiteContentForm from "./SiteContentForm";
import { logoutAdmin } from "./actions";
import { getAdminSessionTtlMinutes, isAdminAuthenticated, isAdminConfigured } from "@/lib/adminAuth";
import { getAdminProducts, getSupabaseAdminClient } from "@/lib/supabaseProducts";
import { getRecentOrders } from "@/lib/supabaseOrders";
import { getAdminSiteContent } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "ניהול | smadar heymans",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const adminConfigured = isAdminConfigured();
  const hasServiceKey = Boolean(getSupabaseAdminClient());
  const isAuthenticated = await isAdminAuthenticated();

  return (
    <main dir="rtl" className="min-h-screen bg-cream px-5 py-10 text-ink md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-gold">smadar heymans</p>
            <h1 className="mt-3 text-[40px] font-semibold leading-tight md:text-[58px]">
              ניהול תיקים
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
              כאן אפשר להוסיף תיקים, להחליף תמונות, לעדכן מחיר ולסמן מה מוצג באתר.
            </p>
            {isAuthenticated && (
              <p className="mt-2 text-[13px] leading-6 text-muted">
                מטעמי אבטחה, חיבור הניהול מתנתק אוטומטית אחרי עד {getAdminSessionTtlMinutes()} דקות.
              </p>
            )}
          </div>

          {isAuthenticated && (
            <form action={logoutAdmin}>
              <button type="submit" className="button-light rounded-full px-5 py-3">
                יציאה
              </button>
            </form>
          )}
        </div>

        {!adminConfigured && (
          <SetupBox
            title="חסרה סיסמת ניהול"
            body="צריך להגדיר משתנה ADMIN_PASSWORD — זו הסיסמה לכניסה למסך הניהול."
            steps={[
              "ב-Vercel: Project Settings → Environment Variables → הוסיפי ADMIN_PASSWORD עם סיסמה חזקה (ואז Redeploy).",
              "לעבודה מקומית: הריצי בטרמינל בתיקיית הפרויקט: vercel env pull .env.local — זה ימשוך את כל המשתנים מ-Vercel.",
            ]}
          />
        )}

        {adminConfigured && !hasServiceKey && (
          <SetupBox
            title="חסר מפתח ניהול של Supabase"
            body="צריך SUPABASE_SERVICE_ROLE_KEY כדי שהאדמין יוכל לשמור מוצרים ולהעלות תמונות. המפתח נשאר בצד השרת בלבד ולעולם לא נחשף לדפדפן."
            steps={[
              "אם את עובדת מקומית (localhost) והאתר החי כן עובד — הריצי: vercel env pull .env.local ואז הפעילי מחדש את השרת. זה הפתרון הנפוץ.",
              "אם גם באתר החי חסר — ב-Supabase: Project Settings → API → service_role key, והוסיפי אותו ב-Vercel בשם SUPABASE_SERVICE_ROLE_KEY.",
            ]}
          />
        )}

        {adminConfigured && hasServiceKey && !isAuthenticated && <AdminLogin />}

        {adminConfigured && hasServiceKey && isAuthenticated && <AdminContent />}
      </div>
    </main>
  );
}

async function AdminContent() {
  const [products, orders, siteContent] = await Promise.all([
    getAdminProducts(),
    getRecentOrders(),
    getAdminSiteContent(),
  ]);
  const activeOrders = orders.filter(isActiveOrder);
  const pastOrders = orders.length - activeOrders.length;
  const monthOrders = orders.filter(isCurrentMonthOrder);
  const paidOrders = orders.filter((order) => order.payment_status === "paid");

  return (
    <div className="mt-10 grid gap-12">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="בתור הזמנות" value={activeOrders.length} highlight />
        <StatCard label="הזמנות החודש" value={monthOrders.length} />
        <StatCard label="שולמו" value={paidOrders.length} />
        <StatCard label="מוצרים" value={products.length} />
      </section>

      {/* Quick in-page navigation */}
      <nav className="flex flex-wrap gap-3 text-[12px] font-bold">
        <a href="#admin-orders" className="rounded-full border border-line bg-white/70 px-5 py-2.5 hover:border-ink">
          הזמנות ({activeOrders.length})
        </a>
        <a href="#admin-new" className="rounded-full border border-line bg-white/70 px-5 py-2.5 hover:border-ink">
          הוספת תיק
        </a>
        <a href="#admin-products" className="rounded-full border border-line bg-white/70 px-5 py-2.5 hover:border-ink">
          תיקים קיימים ({products.length})
        </a>
        <a href="#admin-content" className="rounded-full border border-line bg-white/70 px-5 py-2.5 hover:border-ink">
          טקסטים באתר
        </a>
      </nav>

      <section id="admin-orders" className="scroll-mt-8">
        <h2 className="mb-1 text-2xl font-semibold">הזמנות</h2>
        <p className="mb-4 text-[14px] text-muted">
          התור היומי שלך — הזמנות חדשות בראש, וסימון מהיר של בטיפול / שולם / בוטל.
        </p>
        <OrdersPanel orders={orders} />
      </section>

      <section id="admin-new" className="scroll-mt-8">
        <h2 className="mb-1 text-2xl font-semibold">הוספת תיק חדש</h2>
        <p className="mb-4 text-[14px] text-muted">
          אפשר לשמור גם בלי למלא הכל — תיק חסר פרטים יישמר כטיוטה ולא יוצג באתר עד השלמה.
        </p>
        <ProductForm />
      </section>

      <section id="admin-products" className="scroll-mt-8">
        <h2 className="mb-1 text-2xl font-semibold">תיקים קיימים</h2>
        <p className="mb-4 text-[14px] text-muted">
          עריכה, החלפת תמונות, הסתרה מהאתר או מחיקה — כל שינוי מתעדכן באתר מיד.
        </p>
        <AdminProductsPanel products={products} />
      </section>

      <section id="admin-content" className="scroll-mt-8">
        <h2 className="mb-1 text-2xl font-semibold">טקסטים באתר</h2>
        <p className="mb-4 text-[14px] text-muted">
          משפטים כלליים שאפשר לעדכן בלי לפתוח קוד. מדיניות מסירה והחלפות נוסיף אחרי אישור מול סמדר.
        </p>
        <SiteContentForm content={siteContent} />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        highlight ? "border-ink bg-ink text-cream" : "border-line bg-white/80"
      }`}
    >
      <p className={`eyebrow ${highlight ? "text-gold" : "text-gold"}`}>{label}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
    </div>
  );
}

function isActiveOrder(order: { status: string; payment_status: string }) {
  return !(
    order.payment_status === "paid" ||
    order.payment_status === "cancelled" ||
    order.status === "paid" ||
    order.status === "delivered" ||
    order.status === "cancelled"
  );
}

function isCurrentMonthOrder(order: { created_at: string }) {
  const date = new Date(order.created_at);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function SetupBox({
  title,
  body,
  steps,
}: {
  title: string;
  body: string;
  steps?: string[];
}) {
  return (
    <div className="mt-10 rounded-3xl border border-gold/40 bg-white/85 p-6">
      <p className="eyebrow text-gold">צריך הגדרה חד-פעמית</p>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      <p className="mt-3 leading-7 text-muted">{body}</p>
      {steps && steps.length > 0 && (
        <ol className="mt-4 grid gap-2">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-line bg-cream/60 p-3 text-[14px] leading-7">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">
                {i + 1}
              </span>
              <span dir="auto">{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

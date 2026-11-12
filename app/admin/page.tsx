import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSessionTtlMinutes, isAdminAuthenticated, isAdminConfigured } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabase/clients";
import AdminLogin from "./AdminLogin";
import SetupBox from "./_components/SetupBox";

export const metadata: Metadata = {
  title: "ניהול | smadar heymans",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// The front door of the admin. Signed in: straight to the bags. Not signed in:
// the password box. Anything missing from the setup is explained here.
export default async function AdminEntry() {
  const configured = isAdminConfigured();
  const hasServiceKey = Boolean(getSupabaseAdminClient());

  if (configured && hasServiceKey && (await isAdminAuthenticated())) redirect("/admin/products");

  return (
    <main dir="rtl" className="min-h-screen bg-cream px-5 py-14 text-ink md:px-10">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow text-gold">smadar heymans</p>
        <h1 className="mt-3 text-[40px] font-semibold leading-tight md:text-[52px]">ניהול האתר</h1>
        <p className="mt-3 text-[15px] leading-7 text-muted">כאן מוסיפים תיקים, מחליפים תמונות, מעדכנים מחירים ורואים הזמנות.</p>

        {!configured && (
          <SetupBox
            title="חסרה סיסמת ניהול"
            body="צריך להגדיר משתנה ADMIN_PASSWORD. זו הסיסמה לכניסה למסך הניהול."
            steps={[
              "בוורסל: Project Settings, Environment Variables, והוסיפי ADMIN_PASSWORD עם סיסמה חזקה (ואז Redeploy).",
              "לעבודה מקומית: vercel env pull .env.local --environment=production",
            ]}
          />
        )}

        {configured && !hasServiceKey && (
          <SetupBox
            title="חסר מפתח ניהול של Supabase"
            body="צריך SUPABASE_SERVICE_ROLE_KEY כדי שהאדמין יוכל לשמור תיקים ולהעלות תמונות. המפתח נשאר בצד השרת ולעולם לא נחשף לדפדפן."
            steps={[
              "ב-Supabase: Project Settings, API, והעתיקי את מפתח ה-service_role (או ה-secret).",
              "הוסיפי אותו בוורסל בשם SUPABASE_SERVICE_ROLE_KEY ואז Redeploy. לעבודה מקומית: שורה בקובץ .env.local.",
            ]}
          />
        )}

        {configured && hasServiceKey && (
          <>
            <AdminLogin />
            <p className="mt-4 text-center text-[13px] text-muted">מטעמי אבטחה, החיבור מתנתק אוטומטית אחרי עד {getAdminSessionTtlMinutes()} דקות.</p>
          </>
        )}
      </div>
    </main>
  );
}

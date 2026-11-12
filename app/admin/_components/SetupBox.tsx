// A plain notice with numbered steps, used when the admin cannot work yet
// (missing password, missing key, or the database is unreachable).
export default function SetupBox({
  eyebrow = "צריך הגדרה חד-פעמית",
  title,
  body,
  steps,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  steps?: string[];
}) {
  return (
    <div className="mt-10 rounded-3xl border border-gold/40 bg-white/85 p-6">
      <p className="eyebrow text-gold">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      <p className="mt-3 leading-7 text-muted">{body}</p>
      {steps && steps.length > 0 && (
        <ol className="mt-4 grid gap-2">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-3 rounded-2xl border border-line bg-cream/60 p-3 text-[14px] leading-7">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">{index + 1}</span>
              <span dir="auto">{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// Shown instead of the screen's content when the database cannot be read. The
// bags are not gone: only the connection is down, and saving now could overwrite
// something, so nothing is editable until it is back.
export function DatabaseDownNotice() {
  return (
    <SetupBox
      eyebrow="תקלה זמנית"
      title="אין חיבור למסד הנתונים"
      body="התיקים וההזמנות לא נטענו, ולכן אין להוסיף או לערוך כרגע. התיקים עצמם לא נמחקו, רק החיבור ל-Supabase לא עובד."
      steps={[
        "ב-Supabase Dashboard: אם הפרויקט מופיע כ-Paused, לחצי Restore. פרויקט בחינם עובר להשהיה אחרי כשבוע בלי שימוש, והנתונים חוזרים אחרי השחזור.",
        "אם הפרויקט פעיל: Project Settings, API, והשוואת ה-Project URL למשתנה NEXT_PUBLIC_SUPABASE_URL בוורסל.",
      ]}
    />
  );
}

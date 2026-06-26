"use client";

import { motion } from "framer-motion";

const notes = [
  {
    title: "רואים לפני שמזמינים",
    body: "כל דגם כולל תמונה, מחיר, מידות ותיאור קצר כדי להבין אם הוא מתאים לפני שמוסיפים לסל.",
  },
  {
    title: "תיאום אישי",
    body: "אחרי ההזמנה אנחנו עוברים על הפרטים וחוזרים אליכם לתיאום מסירה, צבעים או שאלות פתוחות.",
  },
  {
    title: "מלאי שמתעדכן",
    body: "דגמים חדשים, תמונות ומצב מלאי מתעדכנים דרך מערכת הניהול, בלי לחכות לשינוי באתר.",
  },
  {
    title: "איסוף באזור אשדוד",
    body: "המסירה נעשית בתיאום אישי באזור אשדוד והסביבה, עם אפשרות להזמנות מיוחדות לפי דגם.",
  },
];

export default function Numbers() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-editorial px-5 md:px-10">
        <div className="grid gap-4 md:grid-cols-4">
          {notes.map((note, i) => (
            <motion.article
              key={note.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.06 }}
              className="panel rounded-[24px] p-6"
            >
              <p className="eyebrow text-gold">חשוב לדעת</p>
              <h3 className="mt-4 text-[24px] font-semibold leading-tight text-ink">
                {note.title}
              </h3>
              <p className="mt-4 text-[14px] leading-7 text-muted">{note.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

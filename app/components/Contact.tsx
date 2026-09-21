"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { submitContact, type ContactState } from "../actions/contact";
import {
  SMADAR_EMAIL,
  SMADAR_PHONE_DISPLAY,
  SMADAR_WHATSAPP,
} from "@/lib/orderConstants";
import FadeIn from "./FadeIn";
import HoneypotField from "./HoneypotField";

const initialState: ContactState = { status: "idle" };
const inputBase =
  "w-full rounded-2xl border border-line bg-white/75 px-4 py-4 text-[15px] text-ink outline-none transition placeholder:text-muted/55 focus:border-ink focus:bg-white";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-2 text-[13px] text-ink/70">{msg}</p>;
}

export default function Contact() {
  const [state, formAction, pending] = useActionState(submitContact, initialState);

  // Manual submit so React doesn't reset the form (and wipe the message) when
  // the server returns a validation error.
  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return (
    <section id="contact" className="pb-24 md:pb-32">
      <div className="mx-auto max-w-editorial px-5 md:px-10">
        <div className="overflow-hidden rounded-[28px] border border-line bg-white/45 shadow-[0_32px_90px_-68px_rgba(17,17,17,0.75)] backdrop-blur">
          <div className="grid gap-0 md:grid-cols-12">
            <FadeIn className="bg-ink p-7 text-cream md:col-span-5 md:p-10 lg:p-12">
              <p className="eyebrow text-gold">הזמנה ושאלות</p>
              <h2 className="mt-5 text-[34px] font-semibold leading-tight md:text-[44px]">
                מתלבטים לגבי דגם, צבע או התאמה אישית?
              </h2>
              <p className="mt-6 max-w-md text-[16px] leading-8 text-cream/72">
                שלחו הודעה קצרה ונחזור אליכם עם תשובה ברורה לגבי זמינות, צבעים, מידות וזמני הכנה.
              </p>

              <div className="mt-9 grid gap-4">
                <a
                  href={`mailto:${SMADAR_EMAIL}`}
                  className="rounded-2xl border border-cream/14 bg-white/[0.05] p-5 transition hover:bg-white/[0.09]"
                >
                  <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-gold">אימייל</span>
                  <span dir="ltr" className="mt-2 block text-[15px] text-cream">{SMADAR_EMAIL}</span>
                </a>
                <a
                  href={`https://wa.me/${SMADAR_WHATSAPP}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-cream/14 bg-white/[0.05] p-5 transition hover:bg-white/[0.09]"
                >
                  <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-gold">וואטסאפ / ביט</span>
                  <span dir="ltr" className="mt-2 block text-[15px] text-cream">{SMADAR_PHONE_DISPLAY}</span>
                </a>
              </div>
            </FadeIn>

            <FadeIn className="p-7 text-ink md:col-span-7 md:p-10 lg:p-12" delay={0.1}>
              {state.status === "success" ? (
                <div className="flex min-h-[420px] flex-col justify-center">
                  <p className="eyebrow">ההודעה התקבלה</p>
                  <h3 className="mt-5 text-[34px] font-semibold leading-tight">{state.message}</h3>
                  <p className="mt-5 max-w-md text-[15px] leading-8 text-muted">
                    ההודעה נשלחה לחנות וגם אליכם כאישור. נחזור בהקדם.
                  </p>
                </div>
              ) : (
                <form onSubmit={submitMessage} className="relative space-y-5">
                  <HoneypotField />
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className="eyebrow mb-2 block">שם מלא</label>
                      <input id="contact-name" name="name" required autoComplete="name" className={inputBase} />
                      <FieldError msg={state.errors?.name} />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="eyebrow mb-2 block">אימייל</label>
                      <input id="contact-email" name="email" type="email" required autoComplete="email" className={inputBase} />
                      <FieldError msg={state.errors?.email} />
                    </div>
                    <div>
                      <label htmlFor="contact-phone" className="eyebrow mb-2 block">טלפון</label>
                      <input id="contact-phone" name="phone" type="tel" autoComplete="tel" className={inputBase} />
                    </div>
                    <div>
                      <label htmlFor="contact-subject" className="eyebrow mb-2 block">נושא</label>
                      <select id="contact-subject" name="subject" defaultValue="general" className={inputBase}>
                        <option value="general">שאלה כללית</option>
                        <option value="commission">הזמנה מותאמת אישית</option>
                        <option value="press">שיתוף פעולה</option>
                        <option value="other">נושא אחר</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="eyebrow mb-2 block">הודעה</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      placeholder="כתבו איזה דגם אהבתם, צבעים מועדפים, מועד רצוי או כל שאלה אחרת..."
                      className={`${inputBase} resize-none`}
                    />
                    <FieldError msg={state.errors?.message} />
                  </div>

                  {state.status === "error" && state.message && (
                    <p className="rounded-2xl border border-line bg-white/70 p-4 text-[14px] text-ink/80">
                      {state.message}
                    </p>
                  )}

                  <button type="submit" disabled={pending} className="button-dark w-full rounded-full disabled:opacity-50">
                    {pending ? "שולח..." : "שליחת הודעה"}
                  </button>
                </form>
              )}
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

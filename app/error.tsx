"use client";

import { useEffect } from "react";

// Shown only when a page could not be built and there is no earlier good copy
// to fall back on. For example, the very first visit after a deploy while the
// database is unreachable. Once a page has been built successfully, an outage
// no longer reaches visitors: the last good copy keeps being served.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-cream px-6 text-center text-ink">
      <div className="max-w-md">
        <p className="eyebrow">smadar heymans</p>
        <h1 className="mt-4 text-[32px] font-semibold leading-tight">האתר לא נטען כרגע</h1>
        <p className="mt-4 text-[15px] leading-7 text-muted">
          יש תקלה זמנית בטעינת התיקים. אפשר לנסות שוב בעוד כמה רגעים, או לפנות אלינו ישירות בוואטסאפ.
        </p>
        <button type="button" onClick={reset} className="button-dark mt-7 rounded-full px-6 py-3">
          לנסות שוב
        </button>
      </div>
    </main>
  );
}

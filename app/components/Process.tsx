import { processSteps } from "@/lib/products";
import type { SiteContent } from "@/lib/siteContent";
import FadeIn from "./FadeIn";

export default function Process({ content }: { content: SiteContent }) {
  return (
    <section id="process" className="py-24 md:py-32">
      <div className="mx-auto max-w-editorial px-5 md:px-10">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="eyebrow">מאחורי הקלעים</p>
            <h2 className="mt-4 text-[38px] font-semibold leading-tight md:text-[58px]">
              ככה תיק עובר מרעיון לפריט מוכן.
            </h2>
          </div>
          <p className="text-[16px] leading-8 text-muted md:col-span-4 md:col-start-9">
            {content.processBody}
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {processSteps.map((step) => (
            <FadeIn key={step.number}>
              <article className="panel h-full rounded-[26px] p-6 transition duration-500 hover:-translate-y-1 hover:bg-white">
                <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-gold">
                  שלב {step.number}
                </p>
                <h3 className="mt-5 text-[26px] font-semibold leading-tight">
                  {step.title}
                </h3>
                <div className="mt-5 space-y-3">
                  {step.body.map((line) => (
                    <p key={line} className="text-[14px] leading-7 text-muted">
                      {line}
                    </p>
                  ))}
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

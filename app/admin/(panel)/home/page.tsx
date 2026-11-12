import { getAdminSiteContent } from "@/lib/site-content";
import SiteContentForm from "../../SiteContentForm";

export default async function HomeTextsPage() {
  const content = await getAdminSiteContent();

  return (
    <div>
      <h1 className="text-[30px] font-semibold leading-tight md:text-[38px]">דף הבית</h1>
      <p className="mt-2 text-[14px] leading-7 text-muted">הטקסטים שמופיעים בדף הבית של האתר. אחרי שמירה השינוי מופיע באתר תוך שניות.</p>
      <div className="mt-6">
        <SiteContentForm content={content} />
      </div>
    </div>
  );
}

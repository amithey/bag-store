"use server";

import { revalidatePath } from "next/cache";
import { saveSiteContent, type SiteContent } from "@/lib/site-content";
import { assertSameOrigin } from "@/lib/requestSecurity";
import { requireAdmin } from "./guards";

export async function saveSiteContentAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();

  const content: SiteContent = {
    heroTitleLine1: String(formData.get("heroTitleLine1") || ""),
    heroTitleLine2: String(formData.get("heroTitleLine2") || ""),
    heroBody: String(formData.get("heroBody") || ""),
    collectionTitle: String(formData.get("collectionTitle") || ""),
    trustNote: String(formData.get("trustNote") || ""),
    processBody: String(formData.get("processBody") || ""),
  };

  const saved = await saveSiteContent(content);
  if (!saved) {
    throw new Error("Failed to save site content.");
  }

  // "layout" refreshes every page under the root layout: the home page, every
  // product page and the sitemap. The root layout also loads the catalog (for
  // the cart), so refreshing only "/" would leave product pages stale.
  revalidatePath("/", "layout");
}

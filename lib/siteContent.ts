import { getSupabaseAdminClient, getSupabaseBrowserClient } from "./supabaseProducts";

export type SiteContent = {
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroBody: string;
  collectionTitle: string;
  trustNote: string;
  processBody: string;
};

export const defaultSiteContent: SiteContent = {
  heroTitleLine1: "תיקים סרוגים בעבודת יד,",
  heroTitleLine2: "אחד אחד.",
  heroBody:
    "דגמים קטנים ושימושיים, עם פרזול יפה, בטנה פנימית ומסירה אישית באזור אשדוד והסביבה.",
  collectionTitle: "כל תיק מקבל את המקום שלו.",
  trustNote: "לא משלמים באתר כרגע. אנחנו נחזור אליכם לאישור, תיאום מסירה ותשלום.",
  processBody: "בוחרים דגם, צבע וחומר, ומשם מכינים את התיק בעבודת יד עד למסירה.",
};

const contentKeys = Object.keys(defaultSiteContent) as Array<keyof SiteContent>;

export async function getSiteContent(): Promise<SiteContent> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return defaultSiteContent;

  const { data, error } = await supabase.from("site_content").select("key,value");
  if (error || !data) {
    if (error) console.warn("[supabase] site content fallback:", error.message);
    return defaultSiteContent;
  }

  return rowsToContent(data);
}

export async function getAdminSiteContent(): Promise<SiteContent> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return defaultSiteContent;

  const { data, error } = await supabase.from("site_content").select("key,value");
  if (error || !data) {
    if (error) console.warn("[supabase] admin site content fallback:", error.message);
    return defaultSiteContent;
  }

  return rowsToContent(data);
}

export async function saveSiteContent(content: SiteContent) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const rows = contentKeys.map((key) => ({
    key,
    value: content[key].trim() || defaultSiteContent[key],
  }));

  const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "key" });
  if (error) {
    console.error("[supabase] failed to save site content:", error);
    return false;
  }

  return true;
}

function rowsToContent(rows: Array<{ key: string; value: string }>): SiteContent {
  const values = { ...defaultSiteContent };

  for (const row of rows) {
    if (isContentKey(row.key) && row.value?.trim()) {
      values[row.key] = row.value.trim();
    }
  }

  return values;
}

function isContentKey(key: string): key is keyof SiteContent {
  return contentKeys.includes(key as keyof SiteContent);
}

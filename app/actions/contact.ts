"use server";

import { z } from "zod";
import { sendContactEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertSameOrigin, getClientIpKey } from "@/lib/requestSecurity";

const EmailSchema = z
  .string()
  .trim()
  .email("אנא הזינו כתובת אימייל תקינה.")
  .regex(
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    "אנא הזינו כתובת אימייל אמיתית באנגלית, למשל name@example.com."
  );

const ContactSchema = z.object({
  name: z.string().trim().min(2, "אנא הזינו את שמכם."),
  email: EmailSchema,
  phone: z.string().trim().optional().or(z.literal("")),
  subject: z.enum(["general", "commission", "press", "other"]),
  message: z.string().trim().min(10, "נשמח לעוד כמה מילים, לפחות 10 תווים."),
});

export type ContactState = {
  status: "idle" | "success" | "error";
  errors?: Partial<Record<keyof z.infer<typeof ContactSchema>, string>>;
  message?: string;
};

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  await assertSameOrigin();

  const limit = checkRateLimit(await getClientIpKey("contact"), {
    maxAttempts: 5,
    windowSeconds: 10 * 60,
  });

  if (!limit.allowed) {
    return {
      status: "error",
      message: "נשלחו יותר מדי הודעות בזמן קצר. נסו שוב בעוד כמה דקות.",
    };
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    subject: String(formData.get("subject") ?? "general"),
    message: String(formData.get("message") ?? ""),
  };

  const parsed = ContactSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: ContactState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof ContactSchema>;
      if (!errors[key]) errors[key] = issue.message;
    }
    return { status: "error", errors, message: "אנא בדקו את השדות המסומנים." };
  }

  const sent = await sendContactEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || undefined,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  if (!sent) {
    return {
      status: "error",
      message: "לא הצלחנו לשלוח את ההודעה כרגע. אפשר לפנות ישירות במייל או בוואטסאפ.",
    };
  }

  return {
    status: "success",
    message: "תודה רבה, ההודעה התקבלה. נחזור אליכם בהקדם.",
  };
}

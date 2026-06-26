"use server";

import { z } from "zod";
import {
  ALLOWED_CITIES,
  paymentMethodsHebrew,
  SMADAR_WHATSAPP,
} from "@/lib/orderConstants";
import { sendOrderEmails } from "@/lib/email";
import { sendWhatsAppOrderAlert } from "@/lib/whatsapp";
import { saveOrderRecord } from "@/lib/supabaseOrders";
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

const OrderSchema = z.object({
  name: z.string().trim().min(2, "אנא הזינו שם מלא."),
  email: EmailSchema,
  phone: z
    .string()
    .trim()
    .min(9, "אנא הזינו מספר טלפון תקין, למשל 0501234567.")
    .regex(/^[0-9+\-\s]+$/, "מספר הטלפון יכול להכיל ספרות, רווחים, + או - בלבד."),
  city: z.string().trim().refine((c) => (ALLOWED_CITIES as readonly string[]).includes(c), {
    message: "אנא בחרו יישוב מרשימת אזורי המסירה.",
  }),
  address: z.string().trim().min(5, "אנא הזינו כתובת מלאה."),
  paymentMethod: z.enum(["bit", "cash"], {
    errorMap: () => ({ message: "אנא בחרו אמצעי תשלום." }),
  }),
  notes: z.string().trim().optional(),
  cart: z.string().min(5, "סל הקניות ריק."),
});

const CartItemSchema = z.object({
  product: z.object({
    id: z.string(),
    name: z.string(),
    priceNum: z.number(),
  }),
  quantity: z.number().int().positive(),
  engraving: z.string().optional(),
});

export type OrderState = {
  status: "idle" | "success" | "error";
  errors?: Partial<Record<keyof z.infer<typeof OrderSchema>, string>>;
  message?: string;
  orderId?: string;
  whatsappLink?: string;
  paymentLink?: string;
};

export async function submitOrder(
  _prev: OrderState,
  formData: FormData
): Promise<OrderState> {
  await assertSameOrigin();

  const limit = checkRateLimit(await getClientIpKey("order"), {
    maxAttempts: 4,
    windowSeconds: 10 * 60,
  });

  if (!limit.allowed) {
    return {
      status: "error",
      message: "נשלחו יותר מדי הזמנות בזמן קצר. נסו שוב בעוד כמה דקות.",
    };
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    city: String(formData.get("city") ?? ""),
    address: String(formData.get("address") ?? ""),
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    cart: String(formData.get("cart") ?? ""),
  };

  const parsed = OrderSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: OrderState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof OrderSchema>;
      if (!errors[key]) errors[key] = issue.message;
    }
    return { status: "error", errors, message: "אנא בדקו את השדות המסומנים." };
  }

  let cartJson: unknown;
  try {
    cartJson = JSON.parse(parsed.data.cart);
  } catch {
    return {
      status: "error",
      errors: { cart: "סל הקניות לא תקין." },
      message: "לא הצלחנו לקרוא את סל הקניות.",
    };
  }

  const cartItemsResult = z.array(CartItemSchema).safeParse(cartJson);
  if (!cartItemsResult.success || cartItemsResult.data.length === 0) {
    return {
      status: "error",
      errors: { cart: "סל הקניות ריק." },
      message: "לא נמצאו פריטים בסל.",
    };
  }

  const orderId = `SH-${Math.floor(100000 + Math.random() * 900000)}`;
  const cartItems = cartItemsResult.data;
  const total = cartItems.reduce((sum, item) => sum + item.product.priceNum * item.quantity, 0);
  const cartDescription = cartItems
    .map((item) => {
      const engraving = item.engraving ? ` (חריטה: ${item.engraving})` : "";
      const lineTotal = item.product.priceNum * item.quantity;
      return `• ${item.product.name}${engraving} x ${item.quantity} - ₪${lineTotal.toLocaleString("he-IL")}`;
    })
    .join("\n");

  const paymentLabel = paymentMethodsHebrew[parsed.data.paymentMethod];
  const paymentLink = process.env.BIT_PAYMENT_URL || undefined;

  const orderPayload = {
    orderId,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    city: parsed.data.city,
    address: parsed.data.address,
    paymentLabel,
    total,
    cartDescription,
    notes: parsed.data.notes || undefined,
    paymentLink,
  };

  // Delivery channels are best-effort. The order is considered received once it
  // passed validation — the WhatsApp link below is always available as a manual
  // fallback, so we never tell the customer it "failed" over an email hiccup.
  const [dbSaved, emailSent, whatsappSent] = await Promise.all([
    saveOrderRecord({
      ...orderPayload,
      paymentMethod: parsed.data.paymentMethod,
      cartItems,
    }),
    sendOrderEmails(orderPayload),
    sendWhatsAppOrderAlert(orderPayload),
  ]);

  if (!dbSaved || !emailSent || !whatsappSent) {
    console.warn("[orders] some delivery channels failed", {
      orderId,
      dbSaved,
      emailSent,
      whatsappSent,
    });
  }

  const whatsappMessage = `היי smadar heymans,
רציתי לתאם את ההזמנה שלי מהאתר.
שם: ${parsed.data.name}
מספר הזמנה: ${orderId}
טלפון: ${parsed.data.phone}
אימייל: ${parsed.data.email}
כתובת למסירה: ${parsed.data.city}, ${parsed.data.address}
אמצעי תשלום מועדף: ${paymentLabel}
סה״כ: ₪${total.toLocaleString("he-IL")}

פרטי ההזמנה:
${cartDescription}
${parsed.data.notes ? `\nהערות מיוחדות: ${parsed.data.notes}` : ""}

אשמח לתיאום מסירה ופרטים נוספים. תודה!`;

  return {
    status: "success",
    message: "ההזמנה התקבלה בהצלחה!",
    orderId,
    paymentLink,
    whatsappLink: `https://api.whatsapp.com/send?phone=${SMADAR_WHATSAPP}&text=${encodeURIComponent(whatsappMessage)}`,
  };
}

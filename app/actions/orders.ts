"use server";

import { randomInt } from "crypto";
import { z } from "zod";
import {
  ALLOWED_CITIES,
  paymentMethodsHebrew,
  SMADAR_WHATSAPP,
} from "@/lib/orderConstants";
import { sendOrderEmails } from "@/lib/email";
import { sendWhatsAppOrderAlert } from "@/lib/whatsapp";
import { saveOrderRecord } from "@/lib/supabaseOrders";
import { getOrderableProducts } from "@/lib/supabaseProducts";
import { isSoldOut } from "@/lib/productStock";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertSameOrigin, getClientIpKey } from "@/lib/requestSecurity";

const EmailSchema = z
  .string()
  .trim()
  .max(254, "כתובת האימייל ארוכה מדי.")
  .email("אנא הזינו כתובת אימייל תקינה.")
  .regex(
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    "אנא הזינו כתובת אימייל אמיתית באנגלית, למשל name@example.com."
  );

// Length caps protect against abuse (giant payloads flooding emails, the
// database and WhatsApp messages) without affecting normal customers.
const OrderSchema = z.object({
  name: z.string().trim().min(2, "אנא הזינו שם מלא.").max(80, "השם ארוך מדי."),
  email: EmailSchema,
  phone: z
    .string()
    .trim()
    .min(9, "אנא הזינו מספר טלפון תקין, למשל 0501234567.")
    .max(20, "מספר הטלפון ארוך מדי.")
    .regex(/^[0-9+\-\s]+$/, "מספר הטלפון יכול להכיל ספרות, רווחים, + או - בלבד."),
  city: z.string().trim().max(60).refine((c) => (ALLOWED_CITIES as readonly string[]).includes(c), {
    message: "אנא בחרו יישוב מרשימת אזורי המסירה.",
  }),
  address: z.string().trim().min(5, "אנא הזינו כתובת מלאה.").max(200, "הכתובת ארוכה מדי."),
  paymentMethod: z.enum(["bit", "cash"], {
    errorMap: () => ({ message: "אנא בחרו אמצעי תשלום." }),
  }),
  notes: z.string().trim().max(500, "ההערות ארוכות מדי (עד 500 תווים).").optional(),
  cart: z.string().min(5, "סל הקניות ריק.").max(20000, "סל הקניות גדול מדי."),
});

// Only the product id and quantity are trusted from the browser — name and
// price are re-resolved server-side from the real catalog before charging.
const CartItemSchema = z.object({
  product: z.object({
    id: z.string().min(1).max(40),
  }),
  quantity: z.number().int().min(1).max(20),
  engraving: z.string().max(40).optional(),
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

  // Honeypot: a field hidden from people that only bots fill in. Pretend it
  // worked so the bot doesn't adapt, but send nothing.
  if (String(formData.get("website") ?? "").trim()) {
    return { status: "success", message: "ההזמנה התקבלה בהצלחה!" };
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

  const cartItemsResult = z.array(CartItemSchema).max(30).safeParse(cartJson);
  if (!cartItemsResult.success || cartItemsResult.data.length === 0) {
    return {
      status: "error",
      errors: { cart: "סל הקניות ריק." },
      message: "לא נמצאו פריטים בסל.",
    };
  }

  // Rate-limit only complete, valid orders — a customer fixing typos in the
  // form must not lock themselves out.
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

  // Server-side re-pricing: names and prices always come from the catalog,
  // never from the browser — so a tampered cart can't change what is charged.
  const catalog = await getOrderableProducts();
  if (!catalog) {
    return {
      status: "error",
      message: "לא הצלחנו לאמת את המלאי כרגע. נסו שוב בעוד רגע או פנו אלינו בוואטסאפ.",
    };
  }
  const catalogById = new Map(catalog.map((product) => [product.id, product]));

  const cartItems = [];
  for (const item of cartItemsResult.data) {
    const product = catalogById.get(item.product.id);
    if (!product) {
      return {
        status: "error",
        errors: { cart: "הסל כולל פריט שכבר אינו זמין." },
        message: "הסל כולל פריט שכבר אינו זמין. רעננו את העמוד ונסו שוב.",
      };
    }
    // Sold-out items are blocked in the UI, but re-check here so a tampered
    // request can't place an order for a bag that is no longer available.
    if (isSoldOut(product.stockStatus)) {
      const label = product.name.split(" | ")[0];
      return {
        status: "error",
        errors: { cart: "פריט בסל אזל מהמלאי." },
        message: 'הפריט "' + label + '" אזל מהמלאי. הסירו אותו מהסל ונסו שוב.',
      };
    }
    cartItems.push({
      product: { id: product.id, name: product.name, priceNum: product.priceNum },
      quantity: item.quantity,
      engraving: item.engraving,
    });
  }

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

  // Save first so the id sent to the customer is guaranteed unique; on the
  // rare collision, draw a new id and try again.
  let orderId = createOrderId();
  let dbResult: Awaited<ReturnType<typeof saveOrderRecord>> = "duplicate";
  for (let attempt = 0; dbResult === "duplicate" && attempt < 5; attempt++) {
    if (attempt > 0) orderId = createOrderId();
    dbResult = await saveOrderRecord({
      orderId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      city: parsed.data.city,
      address: parsed.data.address,
      paymentMethod: parsed.data.paymentMethod,
      paymentLabel,
      total,
      cartDescription,
      cartItems,
      notes: parsed.data.notes || undefined,
    });
  }

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
  const dbSaved = dbResult === "saved";
  const [emailSent, whatsappSent] = await Promise.all([
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

function createOrderId() {
  return `SH-${randomInt(100000, 1000000)}`;
}

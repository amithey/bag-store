type WhatsAppOrderAlert = {
  orderId: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  paymentLabel: string;
  total: number;
  cartDescription: string;
  notes?: string;
};

export async function sendWhatsAppOrderAlert(order: WhatsAppOrderAlert): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const alertTo = process.env.WHATSAPP_ALERT_TO;

  if (!token || !phoneNumberId || !alertTo) {
    console.warn("[whatsapp] WhatsApp Cloud API env vars are not set - alert not sent.");
    return false;
  }

  const text = [
    `הזמנה חדשה באתר - ${order.orderId}`,
    `שם: ${order.name}`,
    `טלפון: ${order.phone}`,
    `אימייל: ${order.email}`,
    `כתובת: ${order.city}, ${order.address}`,
    `תשלום: ${order.paymentLabel}`,
    `סה״כ: ₪${order.total.toLocaleString("he-IL")}`,
    "",
    "פרטי ההזמנה:",
    order.cartDescription,
    order.notes ? `\nהערות: ${order.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: alertTo,
        type: "text",
        text: { preview_url: false, body: text },
      }),
    });

    if (!response.ok) {
      console.error("[whatsapp] failed to send alert:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[whatsapp] failed to send alert:", error);
    return false;
  }
}

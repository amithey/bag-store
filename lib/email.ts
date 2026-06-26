import nodemailer from "nodemailer";
import { Resend } from "resend";
import { SMADAR_EMAIL } from "./orderConstants";

const BRAND_NAME = "smadar heymans";
const DEFAULT_FROM = `${BRAND_NAME} <onboarding@resend.dev>`;

export type OrderEmailPayload = {
  orderId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  paymentLabel: string;
  total: number;
  cartDescription: string;
  notes?: string;
  paymentLink?: string;
};

export async function sendOrderEmails(order: OrderEmailPayload): Promise<boolean> {
  try {
    const storeEmail = await sendEmail({
      to: SMADAR_EMAIL,
      replyTo: order.email,
      subject: `הזמנה חדשה ${order.orderId} - ${order.name}`,
      html: renderStoreOrderHtml(order),
    });

    const customerEmail = await sendEmail({
      to: order.email,
      replyTo: SMADAR_EMAIL,
      subject: `סיכום הזמנה ${order.orderId} - ${BRAND_NAME}`,
      html: renderCustomerOrderHtml(order),
    });

    if (!storeEmail.ok || !customerEmail.ok) {
      console.error("[email] order email failed:", {
        store: storeEmail.error,
        customer: customerEmail.error,
      });
      return false;
    }

    return true;
  } catch (e) {
    console.error("[email] failed to send order emails:", e);
    return false;
  }
}

export type ContactEmailPayload = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

const contactSubjectLabels: Record<string, string> = {
  general: "שאלה כללית",
  commission: "הזמנה מותאמת אישית",
  press: "שיתוף פעולה",
  other: "אחר",
};

export async function sendContactEmail(contact: ContactEmailPayload): Promise<boolean> {
  try {
    const storeEmail = await sendEmail({
      to: SMADAR_EMAIL,
      replyTo: contact.email,
      subject: `פנייה חדשה מהאתר - ${contact.name}`,
      html: renderContactStoreHtml(contact),
    });

    if (!storeEmail.ok) {
      console.error("[email] contact store email failed:", storeEmail.error);
      return false;
    }

    try {
      const customerEmail = await sendEmail({
        to: contact.email,
        replyTo: SMADAR_EMAIL,
        subject: `קיבלנו את הפנייה שלך - ${BRAND_NAME}`,
        html: renderContactCustomerHtml(contact),
      });

      if (!customerEmail.ok) {
        console.warn("[email] contact customer copy failed:", customerEmail.error);
      }
    } catch (customerError) {
      console.warn("[email] contact customer copy failed:", customerError);
    }

    return true;
  } catch (e) {
    console.error("[email] failed to send contact email:", e);
    return false;
  }
}

function getFromEmail() {
  const configuredFrom = process.env.ORDER_FROM_EMAIL?.trim();
  return configuredFrom && configuredFrom.includes("@") ? configuredFrom : DEFAULT_FROM;
}

type EmailMessage = {
  to: string;
  replyTo: string;
  subject: string;
  html: string;
};

type EmailSendResult = {
  ok: boolean;
  error?: unknown;
};

async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");

  if (smtpUser && smtpPass) {
    try {
      const port = Number(process.env.SMTP_PORT || 465);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
        port,
        secure: port === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM?.trim() || `${BRAND_NAME} <${smtpUser}>`,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        text: htmlToText(message.html),
        html: message.html,
        envelope: {
          from: smtpUser,
          to: message.to,
        },
      });

      console.info("[email] SMTP email accepted:", {
        to: maskEmail(message.to),
        subject: message.subject,
      });

      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "No SMTP_USER/SMTP_PASS or RESEND_API_KEY configured.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: htmlToText(message.html),
      html: message.html,
    });

    if (result.error) {
      return { ok: false, error: result.error };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "***";
  return `${name.slice(0, 2)}***@${domain}`;
}

function renderStoreOrderHtml(order: OrderEmailPayload): string {
  return renderShell({
    title: "הזמנה חדשה מהאתר",
    subtitle: `מספר הזמנה ${order.orderId}`,
    body: `
      ${detailsTable([
        ["שם", order.name],
        ["אימייל", order.email],
        ["טלפון", order.phone],
        ["יישוב", order.city],
        ["כתובת", order.address],
        ["תשלום", order.paymentLabel],
        ['סה"כ', `₪${order.total.toLocaleString("he-IL")}`],
      ])}
      ${itemsBlock(order.cartDescription)}
      ${notesBlock(order.notes)}
    `,
  });
}

function renderCustomerOrderHtml(order: OrderEmailPayload): string {
  const payment = order.paymentLink
    ? `<a href="${escapeHtml(order.paymentLink)}" style="display:inline-block;background:#111;color:#f7f3ec;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:13px;font-weight:700;margin-top:14px">מעבר לתשלום בביט</a>`
    : `<p style="margin:12px 0 0;color:#686057;font-size:14px;line-height:1.7">קישור תשלום בביט יישלח בהמשך לאחר אישור ההזמנה.</p>`;

  return renderShell({
    title: "תודה, ההזמנה התקבלה",
    subtitle: `סיכום הזמנה / חשבונית לתשלום ${order.orderId}`,
    body: `
      <p style="margin:0 0 18px;color:#111;font-size:15px;line-height:1.8">
        היי ${escapeHtml(order.name)}, תודה על ההזמנה. זהו סיכום ההזמנה שלך לפני תיאום סופי ותשלום.
      </p>
      ${detailsTable([
        ["מספר הזמנה", order.orderId],
        ["טלפון", order.phone],
        ["כתובת למסירה", `${order.city}, ${order.address}`],
        ["תשלום", order.paymentLabel],
        ['סה"כ לתשלום', `₪${order.total.toLocaleString("he-IL")}`],
      ])}
      ${itemsBlock(order.cartDescription)}
      ${payment}
      <p style="margin:18px 0 0;color:#686057;font-size:13px;line-height:1.7">
        הערה: זהו סיכום הזמנה לתשלום. חשבונית מס/קבלה רשמית תופק בהתאם לצורך העסקי ולתיאום מול החנות.
      </p>
    `,
  });
}

function renderContactStoreHtml(contact: ContactEmailPayload): string {
  return renderShell({
    title: "פנייה חדשה מהאתר",
    subtitle: contactSubjectLabels[contact.subject] || contact.subject,
    body: `
      ${detailsTable([
        ["שם", contact.name],
        ["אימייל", contact.email],
        ["טלפון", contact.phone || "לא הוזן"],
        ["נושא", contactSubjectLabels[contact.subject] || contact.subject],
      ])}
      <div style="white-space:pre-wrap;color:#111;font-size:15px;line-height:1.8">${escapeHtml(contact.message)}</div>
    `,
  });
}

function renderContactCustomerHtml(contact: ContactEmailPayload): string {
  return renderShell({
    title: "קיבלנו את הפנייה שלך",
    subtitle: BRAND_NAME,
    body: `
      <p style="margin:0;color:#111;font-size:15px;line-height:1.8">
        היי ${escapeHtml(contact.name)}, תודה שפנית אלינו. קיבלנו את ההודעה ונחזור אליך בהקדם.
      </p>
      <div style="margin-top:18px;padding:14px 16px;background:#f7f3ec;border-radius:12px">
        <div style="color:#7a6248;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">ההודעה שלך</div>
        <div style="white-space:pre-wrap;color:#111;font-size:14px;line-height:1.7">${escapeHtml(contact.message)}</div>
      </div>
    `,
  });
}

function renderShell({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle: string;
  body: string;
}) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<body style="margin:0;background:#f7f3ec;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:620px;margin:0 auto;padding:32px 18px">
    <div style="background:#fff;border:1px solid #d8cab8;border-radius:18px;overflow:hidden">
      <div style="background:#111;padding:24px 28px">
        <div style="color:#b88a45;font-size:11px;letter-spacing:2px;text-transform:uppercase">${BRAND_NAME}</div>
        <h1 style="color:#f7f3ec;font-size:26px;margin:8px 0 0;line-height:1.25">${escapeHtml(title)}</h1>
        <p style="color:#f7f3ec99;font-size:14px;margin:8px 0 0">${escapeHtml(subtitle)}</p>
      </div>
      <div style="padding:26px 28px">${body}</div>
    </div>
  </div>
</body>
</html>`;
}

function detailsTable(rows: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 22px">
    ${rows
      .map(
        ([label, value]) => `<tr>
          <td style="padding:8px 14px 8px 0;color:#7a6248;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#111;font-size:14px;font-weight:700">${escapeHtml(value)}</td>
        </tr>`
      )
      .join("")}
  </table>`;
}

function itemsBlock(cartDescription: string) {
  const cartHtml = cartDescription
    .split("\n")
    .map((line) => `<div style="padding:4px 0;color:#111;font-size:14px;line-height:1.6">${escapeHtml(line)}</div>`)
    .join("");

  return `<div style="margin-top:22px;padding-top:18px;border-top:1px solid #e7ded1">
    <div style="color:#7a6248;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">פרטי ההזמנה</div>
    ${cartHtml}
  </div>`;
}

function notesBlock(notes?: string) {
  if (!notes) return "";
  return `<div style="margin-top:18px;padding:14px 16px;background:#f7f3ec;border-radius:12px">
    <div style="color:#7a6248;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">הערות</div>
    <div style="color:#111;font-size:14px;line-height:1.6">${escapeHtml(notes)}</div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

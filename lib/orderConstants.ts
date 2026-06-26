export const ALLOWED_CITIES = [
  "אשדוד",
  "גן יבנה",
  "גדרה",
  "בני עי״ש",
  "שתולים",
  "שדה עוזיהו",
  "אמונים",
  "עזריקם",
  "בית עזרא",
  "ניצן",
  "באר טוביה",
  "גן הדרום",
  "ניר גלים",
  "חצב",
] as const;

export const paymentMethodsHebrew: Record<"bit" | "cash", string> = {
  bit: "ביט (Bit)",
  cash: "מזומן בעת המסירה",
};

export const SMADAR_EMAIL = "smadarhey@gmail.com";
export const SMADAR_WHATSAPP = "972507810050";
export const SMADAR_PHONE_DISPLAY = "050-781-0050";

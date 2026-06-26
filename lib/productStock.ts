export type ProductStockState = "ready" | "made_to_order" | "last" | "sold_out" | "custom";

export const stockStateLabels: Record<ProductStockState, string> = {
  ready: "מוכן למסירה",
  made_to_order: "בהזמנה אישית",
  last: "פריט אחרון",
  sold_out: "אזל מהמלאי",
  custom: "טקסט מותאם",
};

export const stockStatusText: Record<Exclude<ProductStockState, "custom">, string> = {
  ready: "מוכן למסירה באשדוד והסביבה",
  made_to_order: "ייצור בהזמנה אישית, כ-7 ימי עבודה",
  last: "פריט אחרון מוכן למסירה",
  sold_out: "אזל מהמלאי",
};

export function getStockState(status: string): ProductStockState {
  const value = status.trim();

  if (value.includes("אזל")) return "sold_out";
  if (value.includes("פריט אחרון") || value.includes("יחיד")) return "last";
  if (value.includes("הזמנה אישית") || value.includes("ייצור")) return "made_to_order";
  if (value.includes("מוכן למסירה")) return "ready";

  return "custom";
}

export function getStockStatusFromState(state: ProductStockState, customStatus: string) {
  const cleanCustom = customStatus.trim();
  if (state === "custom") return cleanCustom || "פרטים יתעדכנו בקרוב";
  return stockStatusText[state];
}

export function isSoldOut(status: string) {
  return getStockState(status) === "sold_out";
}

export function isReadyStock(status: string) {
  const state = getStockState(status);
  return state === "ready" || state === "last";
}

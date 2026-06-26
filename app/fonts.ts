import { Frank_Ruhl_Libre } from "next/font/google";

// Elegant Hebrew+Latin serif, used only for luxury display headings
// (hero title, collection ribbon) — not applied globally.
export const serifDisplay = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import SmoothScroll from "./components/SmoothScroll";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteTitle = "smadar heymans | תיקי סריגה בעבודת יד";
const siteDescription =
  "סטודיו בוטיק באשדוד לתיקי סריגה בעבודת יד, במהדורות קטנות ובהזמנה אישית.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | smadar heymans",
  },
  description: siteDescription,
  keywords: [
    "תיקי סריגה",
    "תיק סרוג",
    "עבודת יד",
    "smadar heymans",
    "סמדר היימנס",
    "אשדוד",
    "מתנה",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "smadar heymans",
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="relative bg-cream text-ink font-sans antialiased">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[1] opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(17,17,17,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <SmoothScroll>
          <CartProvider>{children}</CartProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}

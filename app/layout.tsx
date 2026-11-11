import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import SmoothScroll from "./components/SmoothScroll";
import ScrollProgress from "./components/ScrollProgress";
import CartDrawer from "./components/CartDrawer";
import ProductModal from "./components/ProductModal";
import { getSiteContent } from "@/lib/site-content";
import { getProducts } from "@/lib/catalog/queries";
import { siteUrl } from "@/lib/site";

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

// Kept on one line: it is inlined into the HTML before anything else runs.
const SCROLL_RESTORATION_RESET = `(function(){try{if(!("scrollRestoration" in history))return;var n=performance.getEntriesByType("navigation")[0];if(n&&n.type==="back_forward")return;history.scrollRestoration="manual";if(!location.hash)window.scrollTo(0,0);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cart drawer + product modal are mounted once here (not per-page) so they
  // work identically on the homepage and on /product/[id] pages.
  const [siteContent, catalog] = await Promise.all([getSiteContent(), getProducts()]);

  return (
    <html lang="he" dir="rtl">
      <body className="relative bg-cream text-ink font-sans antialiased">
        {/*
          Runs before the browser restores a scroll offset for this history
          entry. Without it a returning visitor (reload, reopened tab, session
          restore) lands wherever they left off — usually far down this long
          one-page site — and that position is then what Lenis locks onto, so
          the site looks like it "opens at the bottom". Real back/forward
          navigation keeps the browser's own restore, which is what people
          expect there.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: SCROLL_RESTORATION_RESET,
          }}
        />
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
          <CartProvider catalog={catalog}>
            <ScrollProgress />
            <CartDrawer trustNote={siteContent.trustNote} />
            <ProductModal />
            {children}
          </CartProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}

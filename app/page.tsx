import Header from "./components/Header";
import Intro from "./components/Intro";
import Hero from "./components/Hero";
import Collection from "./components/Collection";
import Anatomy from "./components/Anatomy";
import Numbers from "./components/Numbers";
import Process from "./components/Process";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ScrollProgress from "./components/ScrollProgress";
import CartDrawer from "./components/CartDrawer";
import ProductModal from "./components/ProductModal";
import ProductCarousel from "./components/ProductCarousel";
import { getProducts } from "@/lib/supabaseProducts";
import { getSiteContent } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function HomePage() {
  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);

  const absolute = (src: string) =>
    src.startsWith("http") ? src : `${siteUrl}${src}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "smadar heymans",
    description:
      "סטודיו בוטיק באשדוד לתיקי סריגה בעבודת יד, במהדורות קטנות ובהזמנה אישית.",
    url: siteUrl,
    image: `${siteUrl}/opengraph-image.jpg`,
    areaServed: "אשדוד והסביבה",
    makesOffer: products.map((p) => ({
      "@type": "Offer",
      priceCurrency: "ILS",
      price: p.priceNum,
      itemOffered: {
        "@type": "Product",
        name: p.name.split(" | ")[0],
        description: p.description,
        image: absolute(p.image),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollProgress />
      <CartDrawer trustNote={siteContent.trustNote} />
      <ProductModal />
      <Header />
      <main>
        <Intro />
        <Hero productCount={products.length} featured={products[0]} content={siteContent} />
        <ProductCarousel products={products} />
        <Collection products={products} content={siteContent} />
        <Anatomy />
        <Numbers />
        <Process content={siteContent} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

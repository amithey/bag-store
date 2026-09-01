import Header from "./components/Header";
import Intro from "./components/Intro";
import Hero from "./components/Hero";
import Collection from "./components/Collection";
import Anatomy from "./components/Anatomy";
import Numbers from "./components/Numbers";
import Process from "./components/Process";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ProductCarousel from "./components/ProductCarousel";
import { getProducts } from "@/lib/supabaseProducts";
import { getSiteContent } from "@/lib/siteContent";
import { absoluteUrl, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, siteContent] = await Promise.all([getProducts(), getSiteContent()]);

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
      url: `${siteUrl}/product/${p.id}`,
      itemOffered: {
        "@type": "Product",
        name: p.name.split(" | ")[0],
        description: p.description,
        image: absoluteUrl(p.image),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so DB-sourced text (product names/descriptions) can never
        // break out of this script tag — blocks stored XSS via the catalog.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\u003c"),
        }}
      />
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

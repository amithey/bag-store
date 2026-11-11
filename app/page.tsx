import { getHebrewName } from "@/lib/catalog/names";
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
import ImageWarmup from "./components/ImageWarmup";
import { getCatalogForCache } from "@/lib/catalog/queries";
import { getSiteContent } from "@/lib/site-content";
import { absoluteUrl, siteUrl } from "@/lib/site";

// Built once and reused for an hour. Saving in the admin refreshes it at once
// (see revalidatePath in app/admin/_actions), so the hour is only a safety net.
export const revalidate = 3600;

export default async function HomePage() {
  const [products, siteContent] = await Promise.all([getCatalogForCache(), getSiteContent()]);

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
        name: getHebrewName(p.name),
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
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
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
      <ImageWarmup sources={products.map((p) => p.image)} />
    </>
  );
}

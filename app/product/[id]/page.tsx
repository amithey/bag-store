import { getHebrewName, getEnglishName } from "@/lib/catalog/names";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getCatalogForCache } from "@/lib/catalog/queries";
import { isSoldOut } from "@/lib/productStock";
import { absoluteUrl, siteUrl } from "@/lib/site";
import ProductCover from "../../components/product/ProductCover";
import ProductGallery from "../../components/product/ProductGallery";
import ProductPageActions from "./ProductPageActions";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

// Pre-builds a page for every bag that exists right now. A bag added later is
// built the first time someone opens it (dynamicParams is on by default) and
// then cached like the rest. If the catalog cannot be read at build time this
// returns nothing instead of failing, and pages are built on first visit.
export async function generateStaticParams() {
  try {
    return (await getCatalogForCache()).map((product) => ({ id: product.id }));
  } catch {
    return [];
  }
}

async function findProduct(id: string) {
  const products = await getCatalogForCache();
  return { product: products.find((p) => p.id === id) || null, products };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { product } = await findProduct(id);
  if (!product) return { title: "הדגם לא נמצא" };

  const name = getHebrewName(product.name);
  const description = product.description.slice(0, 160);
  const image = absoluteUrl(product.image);
  const url = `/product/${product.id}`;

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${name} | smadar heymans`,
      description,
      url,
      images: [{ url: image, width: 1200, height: 1500, alt: product.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | smadar heymans`,
      description,
      images: [image],
    },
    other: {
      "product:price:amount": String(product.priceNum),
      "product:price:currency": "ILS",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const { product, products } = await findProduct(id);
  if (!product) notFound();

  const name = getHebrewName(product.name);
  const englishName = getEnglishName(product.name);
  const soldOut = isSoldOut(product.stockStatus);
  const related = products.filter((p) => p.id !== product.id).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: product.description,
    image: absoluteUrl(product.image),
    sku: product.id,
    material: product.material,
    offers: {
      "@type": "Offer",
      priceCurrency: "ILS",
      price: product.priceNum,
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: `${siteUrl}/product/${product.id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Header />
      <main className="pb-24 pt-28 md:pt-32">
        <div className="mx-auto max-w-editorial px-5 md:px-10">
          <nav className="mb-6 flex items-center gap-2 text-[12px] font-bold text-muted">
            <Link href="/#collection" className="link-underline text-ink">
              הקולקציה
            </Link>
            <span aria-hidden>/</span>
            <span>{name}</span>
          </nav>

          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-6">
              <ProductGallery product={product} />
            </div>

            <div className="flex flex-col md:col-span-6">
              <p className="eyebrow">דגם {product.id}</p>
              <h1 className="mt-4 text-[34px] font-semibold leading-tight md:text-[48px]">
                {name}
              </h1>
              {englishName && (
                <p className="mt-2 text-[13px] font-bold uppercase tracking-[0.18em] text-taupe">
                  {englishName}
                </p>
              )}

              <div className="mt-7 grid gap-3 text-[14px] md:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white/60 p-4">
                  <span className="eyebrow block">חומר</span>
                  <span className="mt-2 block leading-7 text-muted">{product.material}</span>
                </div>
                <div className="rounded-2xl border border-line bg-white/60 p-4">
                  <span className="eyebrow block">מידות</span>
                  <span className="mt-2 block leading-7 text-muted">{product.dimensions}</span>
                </div>
              </div>

              <p className="mt-7 text-[16px] leading-8 text-muted">{product.description}</p>
              <p className="mt-5 inline-flex w-fit rounded-full bg-white px-4 py-3 text-[12px] font-bold text-taupe">
                {product.stockStatus}
              </p>

              <div className="mt-8">
                <ProductPageActions product={product} />
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-20 border-t border-line pt-12">
              <p className="eyebrow">עוד מהקולקציה</p>
              <h2 className="mt-3 text-[26px] font-semibold">דגמים נוספים שאולי יעניינו אתכם</h2>
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className="group block overflow-hidden rounded-[22px] bg-white/60 ring-1 ring-line/60 transition hover:ring-ink/30"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-bone">
                      <ProductCover
                        product={p}
                        sizes="(min-width: 768px) 30vw, 100vw"
                        className="transition duration-700 ease-editorial group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-[15px] font-semibold leading-tight">
                        {getHebrewName(p.name)}
                      </p>
                      <p className="mt-1 text-[13px] font-bold text-taupe">{p.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

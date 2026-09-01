import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getProducts } from "@/lib/supabaseProducts";
import { isSoldOut } from "@/lib/productStock";
import { absoluteUrl, siteUrl } from "@/lib/site";
import ProductGallery from "./ProductGallery";
import ProductPageActions from "./ProductPageActions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

async function findProduct(id: string) {
  const products = await getProducts();
  return { product: products.find((p) => p.id === id) || null, products };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { product } = await findProduct(id);
  if (!product) return { title: "הדגם לא נמצא" };

  const name = product.name.split(" | ")[0];
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

  const name = product.name.split(" | ")[0];
  const englishName = product.name.split(" | ")[1];
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
          __html: JSON.stringify(jsonLd).replace(/</g, "\u003c"),
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
                      <Image
                        src={p.image}
                        alt={p.alt}
                        fill
                        unoptimized
                        sizes="(min-width: 768px) 30vw, 100vw"
                        className={`transition duration-700 ease-editorial group-hover:scale-105 ${
                          p.imageFit === "contain" ? "object-contain p-4" : "object-cover"
                        }`}
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-[15px] font-semibold leading-tight">
                        {p.name.split(" | ")[0]}
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

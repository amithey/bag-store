import Link from "next/link";
import { rowToInput } from "@/lib/admin/product-input";
import { getAdminProducts } from "@/lib/catalog/queries";
import ProductEditor from "../../../_components/ProductEditor";
import { DatabaseDownNotice } from "../../../_components/SetupBox";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);

  let row;
  try {
    row = (await getAdminProducts()).find((product) => product.id === id);
  } catch (error) {
    console.error("[admin] could not load product:", error);
    return <DatabaseDownNotice />;
  }

  if (!row) {
    return (
      <div className="rounded-3xl border border-line bg-white/70 p-8 text-center">
        <p className="text-[18px] font-bold">התיק לא נמצא</p>
        <p className="mt-2 text-muted">ייתכן שהוא נמחק.</p>
        <Link href="/admin/products" className="button-dark mt-5 inline-block rounded-full px-6 py-3">
          חזרה לכל התיקים
        </Link>
      </div>
    );
  }

  // key: a different bag starts a fresh editor. The same bag keeps its state after a
  // save, so the "saved" message is not wiped by the refresh that follows.
  return <ProductEditor key={row.id} initial={rowToInput(row)} justCreated={created === "1"} />;
}

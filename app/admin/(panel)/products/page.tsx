import type { ProductRow } from "@/lib/catalog/types";
import { getAdminProducts } from "@/lib/catalog/queries";
import ProductList from "../../_components/ProductList";
import { DatabaseDownNotice } from "../../_components/SetupBox";

export default async function ProductsPage() {
  let products: ProductRow[];
  try {
    products = await getAdminProducts();
  } catch (error) {
    // Never show an empty list as if there were no bags: that is how an outage
    // looks exactly like "all my bags disappeared".
    console.error("[admin] could not load products:", error);
    return <DatabaseDownNotice />;
  }

  return <ProductList products={products} />;
}

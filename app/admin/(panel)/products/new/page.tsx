import { emptyProductInput } from "@/lib/admin/product-input";
import ProductEditor from "../../../_components/ProductEditor";

export default function NewProductPage() {
  return <ProductEditor initial={emptyProductInput} />;
}

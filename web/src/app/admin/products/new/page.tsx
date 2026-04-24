import { NewProductForm } from "./NewProductForm";
import { NewProductTypeSelectClient } from "./type-select-client";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; cat?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const type = sp?.type ? String(sp.type).trim() : "";
  const cat = sp?.cat ? String(sp.cat).trim() : "";

  if (!type || (type !== "electronic" && type !== "physical")) {
    return <NewProductTypeSelectClient />;
  }

  if (!cat) {
    return <NewProductTypeSelectClient initialType={type} />;
  }

  return <NewProductForm initialProduct={{ product_type: type, category: cat }} />;
}

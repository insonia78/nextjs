import { notFound } from "next/navigation";
import { ProductFeature } from "@/features/product";
import { getProductById } from "@/features/product/functions";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductFeature product={product} />;
}

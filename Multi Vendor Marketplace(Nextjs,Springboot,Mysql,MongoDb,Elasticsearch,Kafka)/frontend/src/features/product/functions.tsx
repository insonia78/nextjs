import { fetchProduct } from "@/lib/api";
import type { ProductFeatureModel } from "./models";

export async function getProductById(id: string): Promise<ProductFeatureModel | null> {
  return fetchProduct(id);
}

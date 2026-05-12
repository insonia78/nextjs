import { fetchCategories, fetchProducts } from "@/lib/api";
import type { HomePageData } from "./models";

export async function getHomePageData(filters: {
  search?: string;
  category?: string;
}): Promise<HomePageData> {
  const [products, categories] = await Promise.all([
    fetchProducts(filters),
    fetchCategories()
  ]);

  return { products, categories };
}

export async function getVendorProducts(vendorId: string): Promise<HomePageData> {
  const data = await getHomePageData({});
  return {
    categories: data.categories,
    products: data.products.filter((product) => product.vendor.id === vendorId)
  };
}

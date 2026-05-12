import { HomeFeature } from "@/features/home";
import { getVendorProducts } from "@/features/home/functions";

type VendorPageProps = {
  params: Promise<{ vendorId: string }>;
};

export default async function VendorPage({ params }: VendorPageProps) {
  const { vendorId } = await params;
  const data = await getVendorProducts(vendorId);

  return <HomeFeature data={data} activeCategory="" initialSearch="" vendorMode />;
}

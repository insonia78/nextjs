import { HomeFeature } from "@/features/home";
import { getHomePageData } from "@/features/home/functions";

export const revalidate = 60;

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : "";
  const data = await getHomePageData({ search, category });

  return <HomeFeature data={data} activeCategory={category} initialSearch={search} />;
}

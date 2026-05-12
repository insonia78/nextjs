export type ProductFeatureModel = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  tags: string[];
  inventory: number;
  vendor: {
    id: string;
    name: string;
    storefront: string;
    rating: number;
  };
};

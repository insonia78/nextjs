export type Vendor = {
  id: string;
  name: string;
  storefront: string;
  rating: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  tags: string[];
  inventory: number;
  vendor: Vendor;
};

export type HomePageData = {
  products: Product[];
  categories: string[];
};

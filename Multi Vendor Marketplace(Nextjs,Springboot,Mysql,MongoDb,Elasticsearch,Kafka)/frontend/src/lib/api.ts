import type { Product } from "@/features/home/models";
import { logger } from "./logger";

const BASE_URL = process.env.MARKETPLACE_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "p-100",
    name: "Wireless Noise Cancelling Headphones",
    description: "Premium wireless headphones with active noise cancellation and crystal clear sound.",
    category: "Electronics",
    price: 59.99,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    tags: ["wireless", "noise-cancelling", "bluetooth"],
    inventory: 32,
    vendor: {
      id: "v-100",
      name: "SoundMax",
      storefront: "Studio Sound",
      rating: 4.8
    }
  },
  {
    id: "p-101",
    name: "Smart Fitness Watch",
    description: "Track workouts, heart rate, and daily goals with a vivid OLED display.",
    category: "Electronics",
    price: 129,
    imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80",
    tags: ["wearable", "fitness", "health"],
    inventory: 18,
    vendor: {
      id: "v-200",
      name: "Northwind Audio",
      storefront: "Motion Lab",
      rating: 4.6
    }
  },
  {
    id: "p-102",
    name: "Mechanical Keyboard",
    description: "Tactile switches, hot-swappable keys, and a compact aluminum frame.",
    category: "Electronics",
    price: 89.99,
    imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=1200&q=80",
    tags: ["keyboard", "office", "gaming"],
    inventory: 25,
    vendor: {
      id: "v-300",
      name: "Atelier Mobile",
      storefront: "Desk Foundry",
      rating: 4.7
    }
  },
  {
    id: "p-103",
    name: "Ceramic Pour Over Set",
    description: "A handcrafted brewing kit for home baristas who want clean, balanced coffee.",
    category: "Home & Kitchen",
    price: 44.5,
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    tags: ["coffee", "ceramic", "kitchen"],
    inventory: 14,
    vendor: {
      id: "v-400",
      name: "Tactile Home",
      storefront: "Morning Ritual",
      rating: 4.9
    }
  }
];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    next: init?.method === "GET" || !init?.method ? { revalidate: 60 } : undefined
  });

  if (!response.ok) {
    logger.error("backend_request_failed", { path, status: response.status });
    throw new Error(`Request failed for ${path}`);
  }

  return response.json() as Promise<T>;
}

async function graphQLRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  return request<T>("/graphql", {
    method: "POST",
    body: JSON.stringify({ query, variables })
  });
}

export async function fetchProducts(filters: { search?: string; category?: string }) {
  try {
    const payload = await graphQLRequest<{ data: { products: Product[] } }>(
      `query Products($search: String, $category: String) {
        products(search: $search, category: $category) {
          id
          name
          description
          category
          price
          imageUrl
          tags
          inventory
          vendor {
            id
            name
            storefront
            rating
          }
        }
      }`,
      filters
    );
    return payload.data.products;
  } catch {
    logger.info("using_fallback_products", filters);
    return filterFallbackProducts(filters);
  }
}

export async function fetchProduct(id: string) {
  try {
    const payload = await graphQLRequest<{ data: { product: Product | null } }>(
      `query Product($id: ID!) {
        product(id: $id) {
          id
          name
          description
          category
          price
          imageUrl
          tags
          inventory
          vendor {
            id
            name
            storefront
            rating
          }
        }
      }`,
      { id }
    );
    return payload.data.product;
  } catch {
    return FALLBACK_PRODUCTS.find((product) => product.id === id) ?? null;
  }
}

export async function fetchCategories() {
  try {
    const payload = await graphQLRequest<{ data: { categories: string[] } }>(
      `query Categories {
        categories
      }`
    );
    return payload.data.categories;
  } catch {
    return [...new Set(FALLBACK_PRODUCTS.map((product) => product.category))];
  }
}

export async function createPayment(payload: {
  userId: string;
  amount: number;
  currency: string;
  orderReference: string;
}) {
  return request<{
    paymentId: string;
    status: string;
    providerReference: string;
    amount: number;
    provider: string;
  }>("/api/payments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createOrder(payload: {
  userId: string;
  total: number;
  paymentReference: string;
  items: Array<{ productId: string; quantity: number }>;
}) {
  return request<{ id: string; status: string }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function filterFallbackProducts(filters: { search?: string; category?: string }) {
  return FALLBACK_PRODUCTS.filter((product) => {
    const matchesSearch = !filters.search
      || `${product.name} ${product.description} ${product.vendor.name}`
        .toLowerCase()
        .includes(filters.search.toLowerCase());
    const matchesCategory = !filters.category || product.category === filters.category;

    return matchesSearch && matchesCategory;
  });
}

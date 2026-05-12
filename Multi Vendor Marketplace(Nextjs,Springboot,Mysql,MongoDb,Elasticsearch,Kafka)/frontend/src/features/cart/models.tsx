import type { Product } from "@/features/home/models";

export type CartItem = Product & {
  quantity: number;
};

export type CheckoutResponse = {
  payment: {
    paymentId: string;
    status: string;
  };
  order: {
    id: string;
    status: string;
  };
};

import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder, createPayment } from "@/lib/api";

const checkoutSchema = z.object({
  userId: z.string().min(1),
  total: z.number().positive(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive()
    })
  ).min(1)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payment = await createPayment({
    userId: parsed.data.userId,
    amount: parsed.data.total,
    currency: "usd",
    orderReference: `draft-${Date.now()}`
  });

  const order = await createOrder({
    userId: parsed.data.userId,
    items: parsed.data.items,
    total: parsed.data.total,
    paymentReference: payment.paymentId
  });

  return NextResponse.json({ payment, order }, { status: 201 });
}

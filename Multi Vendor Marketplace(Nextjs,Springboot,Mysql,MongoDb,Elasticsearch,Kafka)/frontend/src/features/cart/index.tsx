"use client";

import { useState, useTransition } from "react";
import styles from "./css/styles.module.css";
import { getCartTotal } from "./functions";
import { useCart } from "@/lib/cart-store";
import type { CheckoutResponse } from "./models";

export function CartFeature() {
  const { items, removeItem, clearCart } = useCart();
  const [result, setResult] = useState<CheckoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const total = getCartTotal(items);

  const checkout = () => {
    startTransition(async () => {
      setError(null);
      setResult(null);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "u-100",
          total,
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity }))
        })
      });

      if (!response.ok) {
        setError("Checkout failed. Verify backend services are running.");
        return;
      }

      const payload = (await response.json()) as CheckoutResponse;
      setResult(payload);
      clearCart();
    });
  };

  return (
    <div className={`shell ${styles.layout}`}>
      <section className={styles.itemsPanel}>
        <h1>Cart</h1>
        <div className={styles.list}>
          {items.map((item) => (
            <article className={styles.item} key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.quantity} x ${item.price.toFixed(2)}</p>
              </div>
              <button onClick={() => removeItem(item.id)} type="button">Remove</button>
            </article>
          ))}
          {items.length === 0 ? <p className={styles.empty}>Your cart is empty.</p> : null}
        </div>
      </section>

      <aside className={styles.summaryPanel}>
        <h2>Summary</h2>
        <div className={styles.totalRow}>
          <span>Total</span>
          <strong>${total.toFixed(2)}</strong>
        </div>
        <button disabled={isPending || items.length === 0} onClick={checkout} type="button">
          {isPending ? "Processing..." : "Checkout"}
        </button>
        {result ? (
          <p className={styles.success}>
            Order {result.order.id} created and payment {result.payment.paymentId} is {result.payment.status.toLowerCase()}.
          </p>
        ) : null}
        {error ? <p className={styles.error}>{error}</p> : null}
      </aside>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import styles from "./MarketplaceHeader.module.css";

export function MarketplaceHeader() {
  const { itemCount } = useCart();

  return (
    <header className={styles.header}>
      <div className={`shell ${styles.inner}`}>
        <Link className={styles.brand} href="/">
          <span className={styles.badge}>S</span>
          <div>
            <strong>ShopHub</strong>
            <span>Multi-vendor marketplace</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          <Link href="/">Home</Link>
          <Link href="/vendor/v-100">Vendor Dashboard</Link>
          <Link href="/cart">Cart ({itemCount})</Link>
        </nav>
      </div>
    </header>
  );
}

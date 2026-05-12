"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import styles from "./css/styles.module.css";
import type { ProductFeatureModel } from "./models";

export function ProductFeature({ product }: { product: ProductFeatureModel }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  return (
    <div className={`shell ${styles.layout}`}>
      <section className={styles.gallery}>
        <div className={styles.thumbnailRail}>
          {Array.from({ length: 4 }).map((_, index) => (
            <button className={styles.thumb} key={index} type="button">
              <Image alt={`${product.name} preview ${index + 1}`} height={80} src={product.imageUrl} width={80} />
            </button>
          ))}
        </div>
        <div className={styles.heroImageWrap}>
          <Image alt={product.name} className={styles.heroImage} height={580} src={product.imageUrl} width={580} />
        </div>
      </section>

      <section className={styles.details}>
        <p className={styles.breadcrumb}>{product.category} / {product.vendor.storefront}</p>
        <h1>{product.name}</h1>
        <p className={styles.vendor}>by {product.vendor.name}</p>
        <div className={styles.rating}>{product.vendor.rating.toFixed(1)} rating</div>
        <div className={styles.price}>${product.price.toFixed(2)}</div>
        <p className={styles.description}>{product.description}</p>

        <div className={styles.colorRow}>
          <span className={styles.swatch} />
          <span className={`${styles.swatch} ${styles.blue}`} />
          <span className={`${styles.swatch} ${styles.pink}`} />
        </div>

        <div className={styles.quantityRow}>
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            max={product.inventory}
            min={1}
            onChange={(event) => setQuantity(Number(event.target.value))}
            type="number"
            value={quantity}
          />
        </div>

        <div className={styles.actions}>
          <button onClick={() => addItem(product, quantity)} type="button">Add to Cart</button>
          <a href="/cart">Buy Now</a>
        </div>

        <div className={styles.meta}>
          <span>Inventory: {product.inventory}</span>
          <span>Tags: {product.tags.join(", ")}</span>
        </div>
      </section>
    </div>
  );
}

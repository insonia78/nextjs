import Image from "next/image";
import Link from "next/link";
import styles from "./css/styles.module.css";
import type { HomePageData } from "./models";

export function HomeFeature({
  data,
  activeCategory,
  initialSearch,
  vendorMode = false
}: {
  data: HomePageData;
  activeCategory: string;
  initialSearch: string;
  vendorMode?: boolean;
}) {
  const heroProduct = data.products[0];

  return (
    <div className={`shell ${styles.layout}`}>
      <aside className={styles.sidebar}>
        <p className={styles.kicker}>{vendorMode ? "Vendor workspace" : "2. Multi-Vendor Marketplace"}</p>
        <h1>{vendorMode ? "Vendor dashboard" : "A multi-vendor e-commerce platform"}</h1>
        <p>
          Search, category browsing, orders, payments, and vendor management wired to a Spring Boot microservice backend.
        </p>
        <div className={styles.techStack}>
          {[
            "Next.js",
            "Spring Boot",
            "GraphQL",
            "MySQL",
            "MongoDB",
            "Elasticsearch"
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </aside>

      <section className={styles.content}>
        <form action="/" className={styles.searchBar}>
          <input defaultValue={initialSearch} name="search" placeholder="Search for products, brands and more..." />
          <button type="submit">Search</button>
        </form>

        <div className={styles.heroCard}>
          <div>
            <span className={styles.saleBadge}>Summer Sale</span>
            <h2>Up to 50% Off</h2>
            <p>Great deals on electronics, home goods, and trending marketplace picks.</p>
            <Link className={styles.cta} href={heroProduct ? `/product/${heroProduct.id}` : "/cart"}>
              Shop Now
            </Link>
          </div>
          {heroProduct ? (
            <div className={styles.heroImageWrap}>
              <Image alt={heroProduct.name} className={styles.heroImage} height={420} src={heroProduct.imageUrl} width={420} />
            </div>
          ) : null}
        </div>

        <div className={styles.categoryRail}>
          <Link className={!activeCategory ? styles.activeCategory : ""} href="/">
            All Categories
          </Link>
          {data.categories.map((category) => (
            <Link
              className={activeCategory === category ? styles.activeCategory : ""}
              href={`/?category=${encodeURIComponent(category)}`}
              key={category}
            >
              {category}
            </Link>
          ))}
        </div>

        <div className={styles.infoStrip}>
          <span>Free Shipping</span>
          <span>Secure Payment</span>
          <span>Best Quality</span>
          <span>24/7 Support</span>
        </div>

        <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h3>{vendorMode ? "Vendor Products" : "Featured Products"}</h3>
            <Link href="/cart">View Cart</Link>
          </div>

          <div className={styles.productGrid}>
            {data.products.map((product) => (
              <article className={styles.card} key={product.id}>
                <Link href={`/product/${product.id}`}>
                  <Image alt={product.name} className={styles.cardImage} height={260} src={product.imageUrl} width={260} />
                </Link>
                <div className={styles.cardBody}>
                  <div>
                    <p className={styles.category}>{product.category}</p>
                    <Link className={styles.cardTitle} href={`/product/${product.id}`}>
                      {product.name}
                    </Link>
                  </div>
                  <p className={styles.vendor}>by {product.vendor.name}</p>
                  <div className={styles.priceRow}>
                    <strong>${product.price.toFixed(2)}</strong>
                    <span>{product.vendor.rating.toFixed(1)} rating</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

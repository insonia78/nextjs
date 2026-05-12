import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-store";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";

export const metadata: Metadata = {
  title: "ShopHub Marketplace",
  description: "Multi-vendor marketplace boilerplate with Next.js and Spring Boot microservices."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <MarketplaceHeader />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}

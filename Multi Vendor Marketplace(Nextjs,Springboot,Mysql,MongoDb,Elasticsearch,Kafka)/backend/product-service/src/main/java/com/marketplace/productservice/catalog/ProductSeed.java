package com.marketplace.productservice.catalog;

import java.util.List;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductSeed {

    @Bean
    ApplicationRunner seedProducts(ProductCatalogService productCatalogService) {
        return args -> productCatalogService.replaceCatalog(List.of(
                new ProductDocument(
                        "p-100",
                        "Wireless Noise Cancelling Headphones",
                        "Premium wireless headphones with active noise cancellation and crystal clear sound.",
                        "Electronics",
                        59.99,
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
                        List.of("wireless", "noise-cancelling", "bluetooth"),
                        32,
                        new VendorView("v-100", "SoundMax", "Studio Sound", 4.8)
                ),
                new ProductDocument(
                        "p-101",
                        "Smart Fitness Watch",
                        "Track workouts, heart rate, and daily goals with a vivid OLED display.",
                        "Electronics",
                        129.00,
                        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80",
                        List.of("wearable", "fitness", "health"),
                        18,
                        new VendorView("v-200", "Northwind Audio", "Motion Lab", 4.6)
                ),
                new ProductDocument(
                        "p-102",
                        "Mechanical Keyboard",
                        "Tactile switches, hot-swappable keys, and a compact aluminum frame.",
                        "Electronics",
                        89.99,
                        "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=1200&q=80",
                        List.of("keyboard", "office", "gaming"),
                        25,
                        new VendorView("v-300", "Atelier Mobile", "Desk Foundry", 4.7)
                ),
                new ProductDocument(
                        "p-103",
                        "Ceramic Pour Over Set",
                        "A handcrafted brewing kit for home baristas who want clean, balanced coffee.",
                        "Home & Kitchen",
                        44.50,
                        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
                        List.of("coffee", "ceramic", "kitchen"),
                        14,
                        new VendorView("v-400", "Tactile Home", "Morning Ritual", 4.9)
                )
        ));
    }
}

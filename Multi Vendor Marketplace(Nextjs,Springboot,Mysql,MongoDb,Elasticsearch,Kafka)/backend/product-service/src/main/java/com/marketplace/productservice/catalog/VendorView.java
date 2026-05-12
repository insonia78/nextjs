package com.marketplace.productservice.catalog;

public record VendorView(
        String id,
        String name,
        String storefront,
        double rating
) {
}

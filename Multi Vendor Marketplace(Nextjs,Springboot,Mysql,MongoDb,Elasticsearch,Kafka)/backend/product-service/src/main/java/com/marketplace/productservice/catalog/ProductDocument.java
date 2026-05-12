package com.marketplace.productservice.catalog;

import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("products")
public record ProductDocument(
        @Id String id,
        String name,
        String description,
        String category,
        double price,
        String imageUrl,
        List<String> tags,
        int inventory,
        VendorView vendor
) {
}

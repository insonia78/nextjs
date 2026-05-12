package com.marketplace.productservice.catalog;

import org.springframework.data.annotation.Id;

@org.springframework.data.elasticsearch.annotations.Document(indexName = "products")
public record ProductSearchDocument(
        @Id String id,
        String name,
        String category,
        String vendorName,
        double price
) {
}

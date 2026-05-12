package com.marketplace.productservice.catalog;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProductCatalogRepository extends MongoRepository<ProductDocument, String> {

    List<ProductDocument> findByCategoryIgnoreCase(String category);

    List<ProductDocument> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
}

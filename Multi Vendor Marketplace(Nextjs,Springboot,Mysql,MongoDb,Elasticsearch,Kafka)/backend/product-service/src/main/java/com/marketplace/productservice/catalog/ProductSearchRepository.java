package com.marketplace.productservice.catalog;

import java.util.List;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface ProductSearchRepository extends ElasticsearchRepository<ProductSearchDocument, String> {

    List<ProductSearchDocument> findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrVendorNameContainingIgnoreCase(
            String name, String category, String vendorName);
}

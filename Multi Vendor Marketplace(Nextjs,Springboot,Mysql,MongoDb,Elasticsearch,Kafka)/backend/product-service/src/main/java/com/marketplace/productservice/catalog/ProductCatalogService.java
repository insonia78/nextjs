package com.marketplace.productservice.catalog;

import com.marketplace.productservice.audit.AuditTrailHook;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ProductCatalogService {

    private static final Logger logger = LoggerFactory.getLogger(ProductCatalogService.class);

    private final ProductCatalogRepository productCatalogRepository;
    private final ProductSearchRepository productSearchRepository;
    private final AuditTrailHook auditTrailHook;

    public ProductCatalogService(ProductCatalogRepository productCatalogRepository,
            ProductSearchRepository productSearchRepository,
            AuditTrailHook auditTrailHook) {
        this.productCatalogRepository = productCatalogRepository;
        this.productSearchRepository = productSearchRepository;
        this.auditTrailHook = auditTrailHook;
    }

    public List<ProductDocument> products(String search, String category) {
        List<ProductDocument> results;

        if (search != null && !search.isBlank()) {
            results = searchProducts(search);
        } else if (category != null && !category.isBlank()) {
            results = productCatalogRepository.findByCategoryIgnoreCase(category);
        } else {
            results = productCatalogRepository.findAll();
        }

        auditTrailHook.publish("product-service", "query-products", Map.of(
                "search", Optional.ofNullable(search).orElse(""),
                "category", Optional.ofNullable(category).orElse(""),
                "count", results.size()
        ));
        return results;
    }

    public ProductDocument product(String id) {
        ProductDocument product = productCatalogRepository.findById(id).orElse(null);
        auditTrailHook.publish("product-service", "get-product", id);
        return product;
    }

    public List<String> categories() {
        return productCatalogRepository.findAll().stream()
                .map(ProductDocument::category)
                .distinct()
                .sorted()
                .toList();
    }

    public void replaceCatalog(List<ProductDocument> products) {
        productCatalogRepository.deleteAll();
        productCatalogRepository.saveAll(products);

        try {
            productSearchRepository.deleteAll();
            productSearchRepository.saveAll(products.stream()
                    .map(product -> new ProductSearchDocument(
                            product.id(),
                            product.name(),
                            product.category(),
                            product.vendor().name(),
                            product.price()))
                    .toList());
        } catch (Exception exception) {
            logger.warn("Elasticsearch sync skipped: {}", exception.getMessage());
        }
    }

    private List<ProductDocument> searchProducts(String search) {
        try {
            List<String> ids = productSearchRepository
                    .findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCaseOrVendorNameContainingIgnoreCase(
                            search, search, search)
                    .stream()
                    .map(ProductSearchDocument::id)
                    .toList();

            if (!ids.isEmpty()) {
                Map<String, ProductDocument> products = productCatalogRepository.findAllById(ids).stream()
                        .collect(Collectors.toMap(ProductDocument::id, product -> product, (left, right) -> left, LinkedHashMap::new));
                return ids.stream().map(products::get).filter(java.util.Objects::nonNull).toList();
            }
        } catch (Exception exception) {
            logger.warn("Elasticsearch query failed, falling back to Mongo search: {}", exception.getMessage());
        }

        return productCatalogRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(search, search).stream()
                .sorted(Comparator.comparing(ProductDocument::name))
                .toList();
    }
}

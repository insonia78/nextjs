package com.marketplace.productservice.graphql;

import com.marketplace.productservice.catalog.ProductCatalogService;
import com.marketplace.productservice.catalog.ProductDocument;
import java.util.List;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class ProductGraphqlController {

    private final ProductCatalogService productCatalogService;

    public ProductGraphqlController(ProductCatalogService productCatalogService) {
        this.productCatalogService = productCatalogService;
    }

    @QueryMapping
    public List<ProductDocument> products(@Argument String search, @Argument String category) {
        return productCatalogService.products(search, category);
    }

    @QueryMapping
    public ProductDocument product(@Argument String id) {
        return productCatalogService.product(id);
    }

    @QueryMapping
    public List<String> categories() {
        return productCatalogService.categories();
    }
}

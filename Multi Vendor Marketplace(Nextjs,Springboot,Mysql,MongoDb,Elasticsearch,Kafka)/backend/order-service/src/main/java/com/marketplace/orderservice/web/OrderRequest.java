package com.marketplace.orderservice.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record OrderRequest(
        @NotBlank String userId,
        @NotEmpty List<ItemRequest> items,
        @Positive double total,
        String paymentReference
) {
    public record ItemRequest(
            @NotBlank String productId,
            @Positive int quantity
    ) {
    }
}

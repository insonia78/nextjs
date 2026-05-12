package com.marketplace.paymentservice.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record PaymentRequest(
        @NotBlank String userId,
        @Positive double amount,
        String currency,
        String paymentMethodId,
        String orderReference
) {
}

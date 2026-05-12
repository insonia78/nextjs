package com.marketplace.paymentservice.web;

public record PaymentResponse(
        String paymentId,
        String status,
        String providerReference,
        double amount,
        String provider
) {
}

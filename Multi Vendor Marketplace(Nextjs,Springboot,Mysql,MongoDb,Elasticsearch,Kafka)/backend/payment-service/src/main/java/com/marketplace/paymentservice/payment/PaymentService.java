package com.marketplace.paymentservice.payment;

import com.marketplace.paymentservice.audit.AuditTrailHook;
import com.marketplace.paymentservice.web.PaymentRequest;
import com.marketplace.paymentservice.web.PaymentResponse;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final TransactionRepository transactionRepository;
    private final AuditTrailHook auditTrailHook;
    private final String stripeApiKey;

    public PaymentService(TransactionRepository transactionRepository,
            AuditTrailHook auditTrailHook,
            @Value("${STRIPE_SECRET_KEY:}") String stripeApiKey) {
        this.transactionRepository = transactionRepository;
        this.auditTrailHook = auditTrailHook;
        this.stripeApiKey = stripeApiKey;
    }

    public PaymentResponse processPayment(PaymentRequest request) throws StripeException {
        TransactionEntity transaction = new TransactionEntity();
        transaction.setId("pay-" + UUID.randomUUID());
        transaction.setUserId(request.userId());
        transaction.setAmount(request.amount());
        transaction.setCurrency(request.currency() == null || request.currency().isBlank() ? "usd" : request.currency());
        transaction.setCreatedAt(OffsetDateTime.now());

        String providerName;
        String providerReference;
        String status;

        if (stripeApiKey == null || stripeApiKey.isBlank()) {
            providerName = "mock-stripe";
            providerReference = "mock_" + UUID.randomUUID();
            status = "SUCCEEDED";
        } else {
            Stripe.apiKey = stripeApiKey;
            PaymentIntent paymentIntent = PaymentIntent.create(
                    PaymentIntentCreateParams.builder()
                            .setAmount(Math.round(request.amount() * 100))
                            .setCurrency(transaction.getCurrency())
                            .setAutomaticPaymentMethods(
                                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                            .setEnabled(true)
                                            .build())
                            .build());
            providerName = "stripe";
            providerReference = paymentIntent.getId();
            status = paymentIntent.getStatus().toUpperCase();
        }

        transaction.setProviderName(providerName);
        transaction.setProviderReference(providerReference);
        transaction.setStatus(status);
        transactionRepository.save(transaction);
        auditTrailHook.publish("payment-service", "process-payment", Map.of(
                "paymentId", transaction.getId(),
                "orderReference", request.orderReference(),
                "provider", providerName,
                "status", status,
                "amount", transaction.getAmount()
        ));

        return new PaymentResponse(
                transaction.getId(),
                status,
                providerReference,
                transaction.getAmount(),
                providerName
        );
    }
}

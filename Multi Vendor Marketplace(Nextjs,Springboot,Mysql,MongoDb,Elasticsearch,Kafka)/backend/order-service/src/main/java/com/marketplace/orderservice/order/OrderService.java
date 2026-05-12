package com.marketplace.orderservice.order;

import com.marketplace.orderservice.audit.AuditTrailHook;
import com.marketplace.orderservice.web.OrderRequest;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final AuditTrailHook auditTrailHook;

    public OrderService(OrderRepository orderRepository,
            KafkaTemplate<String, Object> kafkaTemplate,
            AuditTrailHook auditTrailHook) {
        this.orderRepository = orderRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.auditTrailHook = auditTrailHook;
    }

    public OrderEntity createOrder(OrderRequest request) {
        OrderEntity order = new OrderEntity();
        order.setId("ord-" + UUID.randomUUID());
        order.setUserId(request.userId());
        order.setTotal(request.total());
        order.setStatus("CONFIRMED");
        order.setPaymentReference(request.paymentReference());
        order.setCreatedAt(OffsetDateTime.now());
        order.setItems(request.items().stream().map(this::toItem).toList());

        OrderEntity savedOrder = orderRepository.save(order);
        Map<String, Object> event = Map.of(
                "orderId", savedOrder.getId(),
                "userId", savedOrder.getUserId(),
                "status", savedOrder.getStatus(),
                "total", savedOrder.getTotal(),
                "paymentReference", savedOrder.getPaymentReference()
        );
        String orderId = savedOrder.getId();
        if (orderId != null) {
            kafkaTemplate.send("order-created", orderId, event);
        }
        auditTrailHook.publish("order-service", "create-order", event);
        return savedOrder;
    }

    public List<OrderEntity> findOrdersByUser(String userId) {
        List<OrderEntity> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        auditTrailHook.publish("order-service", "list-orders", Map.of("userId", userId, "count", orders.size()));
        return orders;
    }

    private OrderItemEntity toItem(OrderRequest.ItemRequest request) {
        OrderItemEntity item = new OrderItemEntity();
        item.setProductId(request.productId());
        item.setQuantity(request.quantity());
        return item;
    }
}

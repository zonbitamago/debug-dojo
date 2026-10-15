package com.example.shop;

import com.example.shop.PaymentClient.PaymentResult;
import com.example.shop.Views.CreatedOrder;
import com.example.shop.Views.ReservedProduct;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final InventoryService inventoryService;
    private final OrderRepository orderRepository;
    private final PaymentClient paymentClient;

    public OrderService(InventoryService inventoryService, OrderRepository orderRepository, PaymentClient paymentClient) {
        this.inventoryService = inventoryService;
        this.orderRepository = orderRepository;
        this.paymentClient = paymentClient;
    }

    @Transactional
    public CreatedOrder createOrder(long userId, long productId, int quantity) {
        ReservedProduct product = inventoryService.reserve(productId, quantity);
        if (product == null) {
            throw new OrderException(HttpStatus.CONFLICT, "在庫が不足しています");
        }

        int amount = product.price() * quantity;
        OrderRepository.InsertedOrder order = orderRepository.insert(userId, productId, quantity, amount);

        PaymentResult payment = paymentClient.charge(order.orderNumber(), amount);
        if (!payment.ok()) {
            throw new OrderException(HttpStatus.PAYMENT_REQUIRED, payment.message());
        }

        orderRepository.markPaid(order.id());
        return new CreatedOrder(order.id(), order.orderNumber(), amount);
    }
}

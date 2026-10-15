package com.example.shop;

import java.time.OffsetDateTime;

public final class Views {

    private Views() {}

    public record ProductView(long id, String name, int price, int stock) {}

    public record ReservedProduct(long id, String name, int price) {}

    public record OrderView(
            long id,
            String orderNumber,
            String productName,
            int quantity,
            int amount,
            String status,
            OffsetDateTime createdAt,
            String userName) {}

    public record CreatedOrder(long id, String orderNumber, int amount) {}

    public record CreateOrderRequest(Long productId, Integer quantity) {}

    public record DailySales(String day, long orders, long sales) {}

    public record ErrorResponse(String error) {}
}

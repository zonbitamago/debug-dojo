package com.example.shop;

import com.example.shop.Views.OrderView;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OrderRepository {

    private final JdbcTemplate jdbc;

    public OrderRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record InsertedOrder(long id, String orderNumber) {}

    public InsertedOrder insert(long userId, long productId, int quantity, int amount) {
        return jdbc.queryForObject(
                """
                INSERT INTO orders (user_id, product_id, quantity, amount)
                VALUES (?, ?, ?, ?)
                RETURNING id, order_number
                """,
                (rs, i) -> new InsertedOrder(rs.getLong("id"), rs.getString("order_number")),
                userId, productId, quantity, amount);
    }

    public void markPaid(long orderId) {
        jdbc.update("UPDATE orders SET status = 'paid' WHERE id = ?", orderId);
    }

    public List<OrderView> findByUser(long userId) {
        return jdbc.query(
                """
                SELECT o.id, o.order_number, o.quantity, o.amount, o.status, o.created_at,
                       p.name AS product_name
                  FROM orders o
                  JOIN products p ON p.id = o.product_id
                 WHERE o.user_id = ?
                 ORDER BY o.created_at DESC
                """,
                (rs, i) -> toView(rs, rs.getString("product_name"), null),
                userId);
    }

    public OrderView findByOrderNumber(String orderNumber) {
        List<OrderView> rows = jdbc.query(
                """
                SELECT o.id, o.order_number, o.quantity, o.amount, o.status, o.created_at,
                       p.name AS product_name, u.name AS user_name
                  FROM orders o
                  JOIN products p ON p.id = o.product_id
                  JOIN users u ON u.id = o.user_id
                 WHERE o.order_number = ?
                """,
                (rs, i) -> toView(rs, rs.getString("product_name"), rs.getString("user_name")),
                orderNumber);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private static OrderView toView(ResultSet rs, String productName, String userName) throws SQLException {
        return new OrderView(
                rs.getLong("id"),
                rs.getString("order_number"),
                productName,
                rs.getInt("quantity"),
                rs.getInt("amount"),
                rs.getString("status"),
                rs.getObject("created_at", OffsetDateTime.class),
                userName);
    }
}

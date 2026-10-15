package com.example.shop;

import com.example.shop.Views.ReservedProduct;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {

    private final JdbcTemplate jdbc;

    public InventoryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public ReservedProduct reserve(long productId, int quantity) {
        List<ReservedProduct> rows = jdbc.query(
                """
                UPDATE products
                   SET stock = stock - ?
                 WHERE id = ?
                   AND stock >= ?
                RETURNING id, name, price
                """,
                (rs, i) -> new ReservedProduct(rs.getLong("id"), rs.getString("name"), rs.getInt("price")),
                quantity, productId, quantity);
        return rows.isEmpty() ? null : rows.get(0);
    }
}

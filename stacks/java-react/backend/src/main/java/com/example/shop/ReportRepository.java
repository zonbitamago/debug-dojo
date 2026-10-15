package com.example.shop;

import com.example.shop.Views.DailySales;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ReportRepository {

    private final JdbcTemplate jdbc;

    public ReportRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<DailySales> dailySales() {
        return jdbc.query(
                """
                SELECT to_char((created_at AT TIME ZONE 'Asia/Tokyo')::date, 'YYYY-MM-DD') AS day,
                       count(*) AS orders,
                       sum(amount) AS sales
                  FROM orders
                 WHERE status = 'paid'
                   AND created_at >= now() - interval '14 days'
                 GROUP BY 1
                 ORDER BY 1 DESC
                """,
                (rs, i) -> new DailySales(rs.getString("day"), rs.getLong("orders"), rs.getLong("sales")));
    }
}

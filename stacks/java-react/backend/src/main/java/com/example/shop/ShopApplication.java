package com.example.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        // LOG_SQL=1 のとき、実行したSQLをログに出す
        if ("1".equals(System.getenv("LOG_SQL"))) {
            System.setProperty("logging.level.org.springframework.jdbc.core.JdbcTemplate", "DEBUG");
        }
        SpringApplication.run(ShopApplication.class, args);
    }
}

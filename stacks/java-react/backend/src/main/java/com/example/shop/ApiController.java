package com.example.shop;

import com.example.shop.Views.CreateOrderRequest;
import com.example.shop.Views.CreatedOrder;
import com.example.shop.Views.DailySales;
import com.example.shop.Views.ErrorResponse;
import com.example.shop.Views.OrderView;
import com.example.shop.Views.ProductView;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final JdbcTemplate jdbc;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final ReportRepository reportRepository;

    public ApiController(JdbcTemplate jdbc, OrderService orderService, OrderRepository orderRepository,
            ReportRepository reportRepository) {
        this.jdbc = jdbc;
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.reportRepository = reportRepository;
    }

    @GetMapping("/products")
    public List<ProductView> products() {
        return jdbc.query(
                "SELECT id, name, price, stock FROM products ORDER BY id",
                (rs, i) -> new ProductView(rs.getLong("id"), rs.getString("name"), rs.getInt("price"), rs.getInt("stock")));
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") long userId,
            @RequestBody CreateOrderRequest request) {
        if (request.productId() == null || request.quantity() == null
                || request.quantity() < 1 || request.quantity() > 5) {
            return ResponseEntity.badRequest().body(new ErrorResponse("入力内容が正しくありません"));
        }
        CreatedOrder order = orderService.createOrder(userId, request.productId(), request.quantity());
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/orders")
    public List<OrderView> orders(@RequestHeader(value = "X-User-Id", defaultValue = "1") long userId) {
        return orderRepository.findByUser(userId);
    }

    @GetMapping("/orders/search")
    public ResponseEntity<?> search(@RequestParam(defaultValue = "") String number) {
        OrderView order = orderRepository.findByOrderNumber(number.trim());
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("注文が見つかりません"));
        }
        return ResponseEntity.ok(order);
    }

    @GetMapping("/reports/daily-sales")
    public List<DailySales> dailySales() {
        return reportRepository.dailySales();
    }

    @ExceptionHandler(OrderException.class)
    public ResponseEntity<ErrorResponse> handleOrderException(OrderException e) {
        return ResponseEntity.status(e.getStatus()).body(new ErrorResponse(e.getMessage()));
    }
}

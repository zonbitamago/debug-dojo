package com.example.shop;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PaymentClient {

    private static final Logger log = LoggerFactory.getLogger(PaymentClient.class);
    private static final String FAILED_MESSAGE = "決済処理に失敗しました。時間をおいて再度お試しください";

    public record PaymentResult(boolean ok, String message) {}

    private final HttpClient http = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build();
    private final String baseUrl;
    private final Duration timeout;

    public PaymentClient(@Value("${payment.url}") String baseUrl, @Value("${payment.timeout-ms}") long timeoutMs) {
        this.baseUrl = baseUrl;
        this.timeout = Duration.ofMillis(timeoutMs);
    }

    public PaymentResult charge(String orderNumber, int amount) {
        String body = "{\"orderNumber\":\"" + orderNumber + "\",\"amount\":" + amount + "}";
        HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + "/charge"))
                .timeout(timeout)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                log.info("[payment] approved order={} amount={}", orderNumber, amount);
                return new PaymentResult(true, null);
            }
            if (response.statusCode() == 402) {
                log.info("[payment] declined order={} amount={} body={}", orderNumber, amount, response.body());
                return new PaymentResult(false, "与信上限を超えているため決済できませんでした");
            }
            log.error("[payment] unexpected response status={} order={}", response.statusCode(), orderNumber);
        } catch (HttpTimeoutException e) {
            log.error("[payment] error order={} amount={} {}: {}",
                    orderNumber, amount, e.getClass().getSimpleName(), e.getMessage());
        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.error("[payment] error order={} amount={}", orderNumber, amount, e);
        }
        return new PaymentResult(false, FAILED_MESSAGE);
    }
}

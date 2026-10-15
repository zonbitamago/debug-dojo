package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

const paymentFailedMessage = "決済処理に失敗しました。時間をおいて再度お試しください"

type paymentClient struct {
	baseURL string
	http    *http.Client
}

type paymentResult struct {
	ok      bool
	message string
}

func newPaymentClient(baseURL string, timeout time.Duration) *paymentClient {
	return &paymentClient{baseURL: baseURL, http: &http.Client{Timeout: timeout}}
}

func (c *paymentClient) charge(ctx context.Context, orderNumber string, amount int) paymentResult {
	body, _ := json.Marshal(map[string]any{"orderNumber": orderNumber, "amount": amount})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/charge", bytes.NewReader(body))
	if err != nil {
		log.Printf("[payment] error order=%s amount=%d %v", orderNumber, amount, err)
		return paymentResult{message: paymentFailedMessage}
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		log.Printf("[payment] error order=%s amount=%d %v", orderNumber, amount, err)
		return paymentResult{message: paymentFailedMessage}
	}
	defer res.Body.Close()

	var resBody struct {
		ChargeID string `json:"chargeId"`
		Code     string `json:"code"`
	}
	json.NewDecoder(res.Body).Decode(&resBody)

	switch {
	case res.StatusCode == http.StatusOK && resBody.ChargeID != "":
		log.Printf("[payment] approved order=%s amount=%d", orderNumber, amount)
		return paymentResult{ok: true}
	case res.StatusCode == http.StatusPaymentRequired:
		log.Printf("[payment] declined order=%s amount=%d code=%s", orderNumber, amount, resBody.Code)
		return paymentResult{message: "与信上限を超えているため決済できませんでした"}
	default:
		log.Printf("[payment] unexpected response status=%d order=%s", res.StatusCode, orderNumber)
		return paymentResult{message: paymentFailedMessage}
	}
}

require "net/http"

module PaymentClient
  Response = Struct.new(:ok, :message, keyword_init: true)

  FAILED_MESSAGE = "決済処理に失敗しました。時間をおいて再度お試しください".freeze

  module_function

  def charge(order_number:, amount:)
    timeout = Integer(ENV.fetch("PAYMENT_TIMEOUT_MS", "1000")) / 1000.0
    uri = URI.join(ENV.fetch("PAYMENT_URL", "http://localhost:4010"), "/charge")

    http = Net::HTTP.new(uri.host, uri.port)
    http.open_timeout = timeout
    http.read_timeout = timeout

    request = Net::HTTP::Post.new(uri, "Content-Type" => "application/json")
    request.body = { orderNumber: order_number, amount: amount }.to_json
    response = http.request(request)
    body = JSON.parse(response.body) rescue {}

    if response.is_a?(Net::HTTPSuccess) && body["chargeId"]
      Rails.logger.info("[payment] approved order=#{order_number} amount=#{amount}")
      Response.new(ok: true)
    elsif response.code == "402"
      Rails.logger.info("[payment] declined order=#{order_number} amount=#{amount} code=#{body['code']}")
      Response.new(ok: false, message: "与信上限を超えているため決済できませんでした")
    else
      Rails.logger.error("[payment] unexpected response status=#{response.code} order=#{order_number}")
      Response.new(ok: false, message: FAILED_MESSAGE)
    end
  rescue Net::OpenTimeout, Net::ReadTimeout, SystemCallError => e
    Rails.logger.error("[payment] error order=#{order_number} amount=#{amount} #{e.class}: #{e.message}")
    Response.new(ok: false, message: FAILED_MESSAGE)
  end
end

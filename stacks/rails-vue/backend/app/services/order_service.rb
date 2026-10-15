class OrderService
  Result = Struct.new(:ok, :status, :error, :order, keyword_init: true)

  class OrderError < StandardError
    attr_reader :status

    def initialize(message, status)
      super(message)
      @status = status
    end
  end

  def self.call(user_id:, product_id:, quantity:)
    new.call(user_id: user_id, product_id: product_id, quantity: quantity)
  end

  def call(user_id:, product_id:, quantity:)
    order = nil

    ActiveRecord::Base.transaction do
      product = Inventory.reserve(product_id, quantity)
      raise OrderError.new("在庫が不足しています", 409) unless product

      amount = product.price * quantity
      order = Order.create!(user_id: user_id, product_id: product_id, quantity: quantity, amount: amount)
      order.reload

      payment = PaymentClient.charge(order_number: order.order_number, amount: amount)
      raise OrderError.new(payment.message, 402) unless payment.ok

      order.update!(status: "paid")
    end

    Result.new(ok: true, order: order)
  rescue OrderError => e
    Result.new(ok: false, status: e.status, error: e.message)
  end
end

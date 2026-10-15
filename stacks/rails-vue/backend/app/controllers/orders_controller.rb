class OrdersController < ApplicationController
  def index
    orders = Order.where(user_id: current_user_id)
                  .includes(:product)
                  .order(created_at: :desc)
    render json: orders.map(&:as_view)
  end

  def search
    order = Order.includes(:product, :user).find_by(order_number: params[:number].to_s.strip)
    return render json: { error: "注文が見つかりません" }, status: :not_found unless order

    render json: order.as_view(include_user: true)
  end

  def create
    product_id = Integer(params[:productId], exception: false)
    quantity = Integer(params[:quantity], exception: false)
    unless product_id && quantity && quantity.between?(1, 5)
      return render json: { error: "入力内容が正しくありません" }, status: :bad_request
    end

    result = OrderService.call(user_id: current_user_id, product_id: product_id, quantity: quantity)
    if result.ok
      render json: { id: result.order.id, orderNumber: result.order.order_number, amount: result.order.amount },
             status: :created
    else
      render json: { error: result.error }, status: result.status
    end
  end
end

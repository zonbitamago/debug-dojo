class Order < ApplicationRecord
  belongs_to :user
  belongs_to :product

  def as_view(include_user: false)
    view = {
      id: id,
      orderNumber: order_number,
      productName: product.name,
      quantity: quantity,
      amount: amount,
      status: status,
      createdAt: created_at.iso8601
    }
    view[:userName] = user.name if include_user
    view
  end
end

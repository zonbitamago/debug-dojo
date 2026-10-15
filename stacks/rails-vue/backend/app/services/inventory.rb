module Inventory
  module_function

  def reserve(product_id, quantity)
    updated = Product.where(id: product_id)
                     .where("stock >= ?", quantity)
                     .update_all(["stock = stock - ?", quantity])
    return nil if updated.zero?

    Product.find(product_id)
  end
end

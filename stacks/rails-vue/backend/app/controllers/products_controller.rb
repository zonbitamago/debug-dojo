class ProductsController < ApplicationController
  def index
    products = Product.order(:id).map do |p|
      { id: p.id, name: p.name, price: p.price, stock: p.stock }
    end
    render json: products
  end
end

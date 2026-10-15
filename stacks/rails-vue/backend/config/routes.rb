Rails.application.routes.draw do
  scope :api do
    get "products", to: "products#index"
    get "orders/search", to: "orders#search"
    get "orders", to: "orders#index"
    post "orders", to: "orders#create"
    get "reports/daily-sales", to: "reports#daily_sales"
  end
end

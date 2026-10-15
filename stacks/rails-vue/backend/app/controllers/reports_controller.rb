class ReportsController < ApplicationController
  DAILY_SALES_SQL = <<~SQL.freeze
    SELECT to_char((created_at AT TIME ZONE 'Asia/Tokyo')::date, 'YYYY-MM-DD') AS day,
           count(*) AS orders,
           sum(amount) AS sales
      FROM orders
     WHERE status = 'paid'
       AND created_at >= now() - interval '14 days'
     GROUP BY 1
     ORDER BY 1 DESC
  SQL

  def daily_sales
    rows = ActiveRecord::Base.connection.select_all(DAILY_SALES_SQL).map do |r|
      { day: r["day"].to_s, orders: r["orders"].to_i, sales: r["sales"].to_i }
    end
    render json: rows
  end
end

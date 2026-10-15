# 各バグの仕込み内容(正解版のコードに対する置換)。build_patches.py が使う: {bug_dir: {stack: [(file, old, new), ...]}}
REACT_STACKS = ["node-react", "java-react", "go-react"]

def react_b01():
    return [
        ("frontend/src/components/OrderForm.tsx",
         "  async function handleOrder() {\n    if (submitting) return;\n    setSubmitting(true);",
         "  async function handleOrder() {\n    setSubmitting(true);"),
        ("frontend/src/components/OrderForm.tsx",
         '<button className="primary" onClick={handleOrder} disabled={submitting}>',
         '<button className="primary" onClick={handleOrder}>'),
    ]

def react_b02():
    return [("frontend/src/components/ShopPage.tsx", "  }, [userId, refreshKey]);", "  }, [userId]);")]

B05_OLD = "to_char((created_at AT TIME ZONE 'Asia/Tokyo')::date, 'YYYY-MM-DD')"
B05_NEW = "to_char(created_at::date, 'YYYY-MM-DD')"

B07 = [("docker-compose.yml", '      PAYMENT_TIMEOUT_MS: "5000"', '      PAYMENT_TIMEOUT: "5000"')]

EDITS = {
  "B01-double-submit": {
    "node-react": react_b01(), "java-react": react_b01(),
    "rails-vue": [
      ("frontend/src/components/OrderForm.vue", "  if (submitting.value) return;\n", ""),
      ("frontend/src/components/OrderForm.vue",
       '<button class="primary" :disabled="submitting" @click="handleOrder">',
       '<button class="primary" @click="handleOrder">'),
    ],
  },
  "B02-stale-stock": {
    "node-react": react_b02(), "java-react": react_b02(),
    "rails-vue": [
      ("frontend/src/components/ShopPage.vue",
       "watch([() => props.userId, refreshKey], loadProducts, { immediate: true });",
       "watch(() => props.userId, loadProducts, { immediate: true });"),
    ],
  },
  "B03-n-plus-one": {
    "node-react": [
      ("backend/src/orderRepository.ts",
       """  const { rows } = await pool.query(
    `SELECT o.id, o.order_number, o.quantity, o.amount, o.status, o.created_at,
            p.name AS product_name
       FROM orders o
       JOIN products p ON p.id = o.product_id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC`,
    [userId],
  );
  return rows.map(toView);
}""",
       """  const { rows } = await pool.query(
    `SELECT id, order_number, product_id, quantity, amount, status, created_at
       FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC`,
    [userId],
  );

  const orders: OrderView[] = [];
  for (const row of rows) {
    const product = await pool.query('SELECT name FROM products WHERE id = $1', [row.product_id]);
    orders.push(toView({ ...row, product_name: product.rows[0]?.name }));
  }
  return orders;
}"""),
    ],
    "rails-vue": [
      ("backend/app/controllers/orders_controller.rb", "                  .includes(:product)\n", ""),
    ],
    "java-react": [
      ("backend/src/main/java/com/example/shop/OrderRepository.java",
       """                SELECT o.id, o.order_number, o.quantity, o.amount, o.status, o.created_at,
                       p.name AS product_name
                  FROM orders o
                  JOIN products p ON p.id = o.product_id
                 WHERE o.user_id = ?
                 ORDER BY o.created_at DESC
                \"\"\",
                (rs, i) -> toView(rs, rs.getString("product_name"), null),
                userId);
    }
""",
       """                SELECT id, order_number, product_id, quantity, amount, status, created_at
                  FROM orders
                 WHERE user_id = ?
                 ORDER BY created_at DESC
                \"\"\",
                (rs, i) -> toView(rs, findProductName(rs.getLong("product_id")), null),
                userId);
    }

    private String findProductName(long productId) {
        return jdbc.queryForObject("SELECT name FROM products WHERE id = ?", String.class, productId);
    }
"""),
    ],
  },
  "B04-transaction-boundary": {
    "node-react": [
      ("backend/src/orderService.ts",
       "const product = await reserveStock(client, productId, quantity);",
       "const product = await reserveStock(pool, productId, quantity);"),
    ],
    "rails-vue": [
      ("backend/app/services/order_service.rb",
       """    ActiveRecord::Base.transaction do
      product = Inventory.reserve(product_id, quantity)
      raise OrderError.new("在庫が不足しています", 409) unless product

      amount""",
       """    product = Inventory.reserve(product_id, quantity)
    raise OrderError.new("在庫が不足しています", 409) unless product

    ActiveRecord::Base.transaction do
      amount"""),
    ],
    "java-react": [
      ("backend/src/main/java/com/example/shop/OrderService.java",
       "import com.example.shop.Views.ReservedProduct;\n",
       "import com.example.shop.Views.ReservedProduct;\nimport org.slf4j.Logger;\nimport org.slf4j.LoggerFactory;\n"),
      ("backend/src/main/java/com/example/shop/OrderService.java",
       "public class OrderService {\n\n",
       "public class OrderService {\n\n    private static final Logger log = LoggerFactory.getLogger(OrderService.class);\n\n"),
      ("backend/src/main/java/com/example/shop/OrderService.java",
       """    @Transactional
    public CreatedOrder createOrder(long userId, long productId, int quantity) {
""",
       """    public CreatedOrder createOrder(long userId, long productId, int quantity) {
        log.info("create order user={} product={} quantity={}", userId, productId, quantity);
        return placeOrder(userId, productId, quantity);
    }

    @Transactional
    public CreatedOrder placeOrder(long userId, long productId, int quantity) {
"""),
    ],
  },
  "B05-timezone": {
    "node-react": [("backend/src/report.ts", B05_OLD, B05_NEW)],
    "rails-vue": [("backend/app/controllers/reports_controller.rb", B05_OLD, B05_NEW)],
    "java-react": [("backend/src/main/java/com/example/shop/ReportRepository.java", B05_OLD, B05_NEW)],
  },
  "B06-missing-index": {
    "common": [("db/init.sql", "CREATE INDEX idx_orders_order_number ON orders (order_number);\n", "")],
  },
  "B07-timeout-config": {"node-react": B07, "rails-vue": B07, "java-react": B07},
  "B08-race-condition": {
    "node-react": [
      ("backend/src/inventory.ts",
       """  const { rows } = await db.query(
    `UPDATE products
        SET stock = stock - $2
      WHERE id = $1
        AND stock >= $2
      RETURNING id, name, price`,
    [productId, quantity],
  );
  return rows[0] ?? null;
}""",
       """  const { rows } = await db.query('SELECT id, name, price, stock FROM products WHERE id = $1', [productId]);
  const product = rows[0];
  if (!product || product.stock < quantity) return null;

  await db.query('UPDATE products SET stock = $2 WHERE id = $1', [productId, product.stock - quantity]);
  return { id: Number(product.id), name: product.name, price: product.price };
}"""),
    ],
    "rails-vue": [
      ("backend/app/services/inventory.rb",
       """    updated = Product.where(id: product_id)
                     .where("stock >= ?", quantity)
                     .update_all(["stock = stock - ?", quantity])
    return nil if updated.zero?

    Product.find(product_id)""",
       """    product = Product.find_by(id: product_id)
    return nil if product.nil? || product.stock < quantity

    product.update!(stock: product.stock - quantity)
    product"""),
    ],
    "java-react": [
      ("backend/src/main/java/com/example/shop/InventoryService.java",
       """    public ReservedProduct reserve(long productId, int quantity) {
        List<ReservedProduct> rows = jdbc.query(
                \"\"\"
                UPDATE products
                   SET stock = stock - ?
                 WHERE id = ?
                   AND stock >= ?
                RETURNING id, name, price
                \"\"\",
                (rs, i) -> new ReservedProduct(rs.getLong("id"), rs.getString("name"), rs.getInt("price")),
                quantity, productId, quantity);
        return rows.isEmpty() ? null : rows.get(0);
    }""",
       """    private record ProductStock(long id, String name, int price, int stock) {}

    public ReservedProduct reserve(long productId, int quantity) {
        List<ProductStock> rows = jdbc.query(
                "SELECT id, name, price, stock FROM products WHERE id = ?",
                (rs, i) -> new ProductStock(rs.getLong("id"), rs.getString("name"), rs.getInt("price"), rs.getInt("stock")),
                productId);
        if (rows.isEmpty() || rows.get(0).stock() < quantity) {
            return null;
        }
        ProductStock product = rows.get(0);
        jdbc.update("UPDATE products SET stock = ? WHERE id = ?", product.stock() - quantity, productId);
        return new ReservedProduct(product.id(), product.name(), product.price());
    }"""),
    ],
  },
}

# go-react(Go のコードはタブでインデントしているので、置換前後の文字列もタブで書く)
GO_B03 = [
  ("backend/order_repository.go",
   """	rows, err := db.Query(ctx, `
		SELECT o.id, o.order_number, o.quantity, o.amount, o.status, o.created_at,
		       p.name AS product_name
		  FROM orders o
		  JOIN products p ON p.id = o.product_id
		 WHERE o.user_id = $1
		 ORDER BY o.created_at DESC`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := []orderView{}
	for rows.Next() {
		var o orderView
		if err := rows.Scan(&o.ID, &o.OrderNumber, &o.Quantity, &o.Amount, &o.Status, &o.CreatedAt, &o.ProductName); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}""",
   """	rows, err := db.Query(ctx, `
		SELECT id, order_number, product_id, quantity, amount, status, created_at
		  FROM orders
		 WHERE user_id = $1
		 ORDER BY created_at DESC`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := []orderView{}
	for rows.Next() {
		var o orderView
		var productID int64
		if err := rows.Scan(&o.ID, &o.OrderNumber, &productID, &o.Quantity, &o.Amount, &o.Status, &o.CreatedAt); err != nil {
			return nil, err
		}
		if err := db.QueryRow(ctx, `SELECT name FROM products WHERE id = $1`, productID).Scan(&o.ProductName); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}"""),
]

GO_B04 = [
  ("backend/order_service.go",
   """	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	product, err := reserveStock(ctx, tx, productID, quantity)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, &orderError{http.StatusConflict, "在庫が不足しています"}
	}
""",
   """	product, err := reserveStock(ctx, s.pool, productID, quantity)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, &orderError{http.StatusConflict, "在庫が不足しています"}
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
"""),
]

GO_B08 = [
  ("backend/inventory.go",
   """	var p reservedProduct
	err := db.QueryRow(ctx, `
		UPDATE products
		   SET stock = stock - $2
		 WHERE id = $1
		   AND stock >= $2
		RETURNING id, name, price`,
		productID, quantity).Scan(&p.ID, &p.Name, &p.Price)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil""",
   """	var p reservedProduct
	var stock int
	err := db.QueryRow(ctx, `SELECT id, name, price, stock FROM products WHERE id = $1`, productID).
		Scan(&p.ID, &p.Name, &p.Price, &stock)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if stock < quantity {
		return nil, nil
	}

	if _, err := db.Exec(ctx, `UPDATE products SET stock = $2 WHERE id = $1`, productID, stock-quantity); err != nil {
		return nil, err
	}
	return &p, nil"""),
]

EDITS["B01-double-submit"]["go-react"] = react_b01()
EDITS["B02-stale-stock"]["go-react"] = react_b02()
EDITS["B03-n-plus-one"]["go-react"] = GO_B03
EDITS["B04-transaction-boundary"]["go-react"] = GO_B04
EDITS["B05-timezone"]["go-react"] = [("backend/report.go", B05_OLD, B05_NEW)]
EDITS["B07-timeout-config"]["go-react"] = B07
EDITS["B08-race-condition"]["go-react"] = GO_B08

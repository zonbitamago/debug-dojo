import type { Queryable } from './db';

export interface ReservedProduct {
  id: number;
  name: string;
  price: number;
}

export async function reserveStock(
  db: Queryable,
  productId: number,
  quantity: number,
): Promise<ReservedProduct | null> {
  const { rows } = await db.query(
    `UPDATE products
        SET stock = stock - $2
      WHERE id = $1
        AND stock >= $2
      RETURNING id, name, price`,
    [productId, quantity],
  );
  return rows[0] ?? null;
}

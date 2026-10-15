import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://app:app@localhost:5432/shop',
  max: 10,
});

export interface Queryable {
  query: (text: string, values?: unknown[]) => Promise<pg.QueryResult>;
}

// LOG_SQL=1 のとき、実行したSQLをログに出す
if (process.env.LOG_SQL === '1') {
  pool.on('connect', (client) => {
    const original = client.query.bind(client) as (...args: unknown[]) => unknown;
    (client as unknown as { query: unknown }).query = (...args: unknown[]) => {
      const text = typeof args[0] === 'string' ? args[0] : (args[0] as { text?: string })?.text;
      if (text) console.log(`[sql] ${text.replace(/\s+/g, ' ').trim()}`, args[1] ?? '');
      return original(...args);
    };
  });
}

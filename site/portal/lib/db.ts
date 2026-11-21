import "server-only";
import pg, { type PoolClient } from "pg";

// date como texto "AAAA-MM-DD" (pg lo da como Date a la medianoche del servidor, y en UTC corre el día) y numeric
// como número (pg lo da como texto).
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, parseFloat);

// Una sola conexión compartida, también con la recarga en caliente de `next dev`.
const g = globalThis as unknown as { pool?: pg.Pool };
export const db = (g.pool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 }));

/** Una transacción: `fn` corre con una conexión propia y se confirma si termina; si tira, se deshace todo. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await db.connect();
  try {
    await c.query("begin");
    const value = await fn(c);
    await c.query("commit");
    return value;
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}

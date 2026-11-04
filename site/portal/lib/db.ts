import "server-only";
import pg from "pg";

// date como texto "AAAA-MM-DD" (pg lo da como Date a la medianoche del servidor, y en UTC corre el día) y numeric
// como número (pg lo da como texto).
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, parseFloat);

// Una sola conexión compartida, también con la recarga en caliente de `next dev`.
const g = globalThis as unknown as { pool?: pg.Pool };
export const db = (g.pool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 }));

import type { PGlite } from "@electric-sql/pglite";
import { migrate, seed } from "./schema";

/** Minimal query interface so the app works against Postgres (prod) or PGlite (local/tests). */
export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

export function pgliteDb(pg: PGlite): Db {
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const res = await pg.query(text, params as never[]);
      return res.rows as T[];
    },
  };
}

async function createDb(): Promise<Db> {
  let db: Db;
  const url = process.env.DATABASE_URL;

  if (url) {
    const postgres = (await import("postgres")).default;
    // prepare:false keeps us compatible with Neon's pooled (pgbouncer) endpoint.
    const sql = postgres(url, { max: 5, idle_timeout: 20, prepare: false });
    db = {
      async query<T>(text: string, params: unknown[] = []) {
        const rows = await sql.unsafe(text, params as never[]);
        return rows as unknown as T[];
      },
    };
  } else {
    const fs = await import("node:fs");
    const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
    fs.mkdirSync(dir, { recursive: true });
    const { PGlite } = await import("@electric-sql/pglite");
    db = pgliteDb(new PGlite(dir));
  }

  await migrate(db);
  await seed(db);
  return db;
}

// Cache on globalThis so Next.js dev hot-reloads don't open the PGlite directory twice.
const g = globalThis as unknown as { __dbPromise?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!g.__dbPromise) {
    g.__dbPromise = createDb().catch((err) => {
      g.__dbPromise = undefined; // allow retry on next request
      throw err;
    });
  }
  return g.__dbPromise;
}

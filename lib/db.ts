import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@/drizzle/src/db/schema';
import * as inventorySchema from '@/drizzle/src/db/inventory-schema';

const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  Boolean(process.env.VITEST) ||
  process.argv.some(arg => arg.includes('test')) ||
  process.execArgv.some(arg => arg.includes('test'));
const rawDbUrl = process.env.DATABASE_URL || (isTestEnv ? 'postgres://mock:mock@localhost:5432/mock' : undefined);

if (!rawDbUrl) {
  throw new Error("DATABASE_URL is not set");
}

// Sanitize DATABASE_URL: channel_binding=require is not supported by Neon WebSocket proxy / PgBouncer pooler
const connectionString = rawDbUrl.replace(
  /([?&])channel_binding=[^&]+(&|$)/,
  "$1"
).replace(/[?&]$/, "");

const fullSchema = { ...schema, ...inventorySchema };
type AppSchema = typeof fullSchema;
export type AppDb = ReturnType<typeof drizzle<AppSchema>>;

declare global {
  // eslint-disable-next-line no-var
  var __neonPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __drizzleDb: AppDb | undefined;
}

const pool =
  globalThis.__neonPool ??
  (() => {
    const p = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    p.on("error", (err: Error) => {
      console.warn("Unexpected Neon pool error on idle client:", err.message);
    });
    return p;
  })();

export const db: AppDb =
  globalThis.__drizzleDb ??
  drizzle(pool, {
    schema: fullSchema,
  });

export { pool };

if (process.env.NODE_ENV !== "production") {
  globalThis.__neonPool = pool;
  globalThis.__drizzleDb = db;
}

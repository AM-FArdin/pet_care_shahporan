import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

const rawUrl = process.env.DATABASE_URL || "";

export const isDbConfigured = Boolean(
  rawUrl &&
  rawUrl.trim() !== "" &&
  !rawUrl.includes("user:password@") &&
  (rawUrl.startsWith("mysql://") || rawUrl.startsWith("mysql2://"))
);

const isLocalhost = rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1");

export const pool = isDbConfigured
  ? mysql.createPool({
      uri: rawUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: isLocalhost ? undefined : { rejectUnauthorized: false },
    })
  : null;

// Fallback pool for Next.js build prerendering when no DB is connected
const fallbackPool = {
  query: () => Promise.resolve([[]]),
  promise: () => fallbackPool,
} as unknown as mysql.Pool;

export const db = pool
  ? drizzle(pool, { schema, mode: "default" })
  : drizzle(fallbackPool, { schema, mode: "default" });

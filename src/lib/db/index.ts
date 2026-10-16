import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const rawUrl = process.env.DATABASE_URL || "";

export const isDbConfigured = Boolean(
  rawUrl &&
  rawUrl.trim() !== "" &&
  (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))
);

// Safe dummy db for build-time prerendering when DATABASE_URL is not set
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createFallbackDb = () => new Proxy({} as ReturnType<typeof drizzle>, {
  get: () => () => Promise.resolve([]),
});

export const db = isDbConfigured
  ? drizzle(neon(rawUrl), { schema })
  : createFallbackDb();

// Keep pool export as null for compatibility — no raw pool needed with Neon HTTP driver
export const pool = null;

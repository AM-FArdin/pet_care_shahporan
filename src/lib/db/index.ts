import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const rawUrl = process.env.DATABASE_URL || "";

export const isDbConfigured = Boolean(
  rawUrl &&
  rawUrl.trim() !== "" &&
  !rawUrl.includes("user:password@host.neon.tech")
);

// Fallback to dummy URL during build or if not configured, preventing crash at initialization
export const sql = neon(
  isDbConfigured
    ? rawUrl
    : "postgresql://dummy:dummy@dummy.neon.tech/dummy?sslmode=require"
);

export const db = drizzle(sql, { schema });

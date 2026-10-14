import { db, isDbConfigured } from "@/lib/db";
import { ensureTablesExist } from "@/lib/db/init";
import { owners } from "@/lib/db/schema";
import { ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json(
      {
        error: "Database not configured. Please set DATABASE_URL in your Vercel Project Settings > Environment Variables.",
        notConfigured: true,
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  try {
    const fetchList = () =>
      q
        ? db
            .select()
            .from(owners)
            .where(or(ilike(owners.name, `%${q}%`), ilike(owners.phone, `%${q}%`)))
            .orderBy(owners.name)
        : db.select().from(owners).orderBy(owners.name);

    try {
      const result = await fetchList();
      return NextResponse.json(result);
    } catch {
      // Table may not exist yet, auto-initialize and retry once
      await ensureTablesExist();
      const result = await fetchList();
      return NextResponse.json(result);
    }
  } catch (error: unknown) {
    console.error("Error in GET /api/owners:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch owners";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured) {
    return NextResponse.json(
      {
        error: "Database not configured. Please set DATABASE_URL in your Vercel Project Settings > Environment Variables.",
        notConfigured: true,
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    try {
      const [owner] = await db.insert(owners).values(body).returning();
      return NextResponse.json(owner, { status: 201 });
    } catch {
      await ensureTablesExist();
      const [owner] = await db.insert(owners).values(body).returning();
      return NextResponse.json(owner, { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error in POST /api/owners:", error);
    const message = error instanceof Error ? error.message : "Failed to create owner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

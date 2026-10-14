import { db, isDbConfigured } from "@/lib/db";
import { ensureTablesExist } from "@/lib/db/init";
import { owners } from "@/lib/db/schema";
import { eq, like, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!isDbConfigured || !db) {
    return NextResponse.json(
      {
        error: "MySQL database not configured. Please set DATABASE_URL in .env.local (e.g. mysql://user:password@localhost:3306/shahporan_vet)",
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
            .where(or(like(owners.name, `%${q}%`), like(owners.phone, `%${q}%`)))
            .orderBy(owners.name)
        : db.select().from(owners).orderBy(owners.name);

    try {
      const result = await fetchList();
      return NextResponse.json(result);
    } catch {
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
  if (!isDbConfigured || !db) {
    return NextResponse.json(
      {
        error: "MySQL database not configured.",
        notConfigured: true,
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    try {
      const [res] = await db.insert(owners).values(body);
      const [newOwner] = await db.select().from(owners).where(eq(owners.id, (res as { insertId: number }).insertId));
      return NextResponse.json(newOwner || { id: (res as { insertId: number }).insertId, ...body }, { status: 201 });
    } catch {
      await ensureTablesExist();
      const [res] = await db.insert(owners).values(body);
      const [newOwner] = await db.select().from(owners).where(eq(owners.id, (res as { insertId: number }).insertId));
      return NextResponse.json(newOwner || { id: (res as { insertId: number }).insertId, ...body }, { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error in POST /api/owners:", error);
    const message = error instanceof Error ? error.message : "Failed to create owner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

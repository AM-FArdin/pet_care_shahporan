import { db, isDbConfigured } from "@/lib/db";
import { ensureTablesExist } from "@/lib/db/init";
import { inventory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  if (!isDbConfigured || !db) {
    return NextResponse.json(
      {
        error: "MySQL database not configured. Please set DATABASE_URL in .env.local (e.g. mysql://user:password@localhost:3306/shahporan_vet)",
        notConfigured: true,
      },
      { status: 503 }
    );
  }

  try {
    const fetchItems = () => db.select().from(inventory).orderBy(inventory.category, inventory.name);

    try {
      const items = await fetchItems();
      return NextResponse.json(items);
    } catch {
      await ensureTablesExist();
      const items = await fetchItems();
      return NextResponse.json(items);
    }
  } catch (error: unknown) {
    console.error("Error in GET /api/inventory:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch inventory";
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
      const [res] = await db.insert(inventory).values(body);
      const [item] = await db.select().from(inventory).where(eq(inventory.id, (res as { insertId: number }).insertId));
      return NextResponse.json(item || { id: (res as { insertId: number }).insertId, ...body }, { status: 201 });
    } catch {
      await ensureTablesExist();
      const [res] = await db.insert(inventory).values(body);
      const [item] = await db.select().from(inventory).where(eq(inventory.id, (res as { insertId: number }).insertId));
      return NextResponse.json(item || { id: (res as { insertId: number }).insertId, ...body }, { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error in POST /api/inventory:", error);
    const message = error instanceof Error ? error.message : "Failed to add inventory item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

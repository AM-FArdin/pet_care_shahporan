import { db, isDbConfigured } from "@/lib/db";
import { ensureTablesExist } from "@/lib/db/init";
import { inventory } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
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
      const [item] = await db.insert(inventory).values(body).returning();
      return NextResponse.json(item, { status: 201 });
    } catch {
      await ensureTablesExist();
      const [item] = await db.insert(inventory).values(body).returning();
      return NextResponse.json(item, { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error in POST /api/inventory:", error);
    const message = error instanceof Error ? error.message : "Failed to add inventory item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
